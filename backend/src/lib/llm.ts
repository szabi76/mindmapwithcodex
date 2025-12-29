import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { ExplorationMode, GraphEdge, GraphNode } from '../types/index.js';

const {
  BEDROCK_MODEL_ID = '',
  BEDROCK_REGION = process.env.AWS_REGION ?? 'us-east-1'
} = process.env;

const SYSTEM_EXPAND = `You are generating a knowledge ontology for exploration. Given a concept and optional context, produce related entities with categorized relationships. Use JSON output.`;
const SYSTEM_EXPLAIN = `You provide concise, context-aware explanations for a node within an exploration.`;

const FIXED_CATEGORIES = [
  'Person',
  'Event',
  'Concept',
  'Place',
  'Time Period',
  'Organization',
  'Work',
  'Movement',
  'Conflict',
  'Treaty',
  'Dynasty',
  'Artwork',
  'Genre',
  'Style',
  'Medium',
  'Theory',
  'Discovery',
  'Phenomenon',
  'Field',
  'School of Thought',
  'Argument',
  'Institution',
  'Policy',
  'Ideology'
];

const client =
  BEDROCK_MODEL_ID && BEDROCK_REGION
    ? new BedrockRuntimeClient({ region: BEDROCK_REGION })
    : null;

export interface OntologyResult {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export async function generateOntologyLLM(params: {
  concept: string;
  mode: ExplorationMode;
  explorationPathLabels: string[];
  centerNodeId: string;
}): Promise<OntologyResult | null> {
  if (!client) {
    throw new Error('Bedrock not configured');
  }

  const prompt = buildExpandPrompt(params);
  const response = await client.send(
    new InvokeModelCommand({
      modelId: BEDROCK_MODEL_ID!,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        anthropic_version: 'bedrock-2023-05-31',
        system: SYSTEM_EXPAND,
        max_tokens: 1024,
        temperature: 0.7,
        messages: [{ role: 'user', content: [{ type: 'text', text: prompt }] }]
      })
    })
  );

  const parsed = parseBedrockJSON<Omit<OntologyResult, 'edges'> & { nodes: any[] }>(response.body);
  if (!parsed || !Array.isArray(parsed.nodes)) {
    throw new Error('Invalid ontology response from LLM');
  }

  const limitedNodes = parsed.nodes.slice(0, 12);
  const paddedNodes =
    limitedNodes.length < 8
      ? [...limitedNodes, ...Array.from({ length: 8 - limitedNodes.length }).map((_, idx) => ({ id: `fallback-${idx}` }))]
      : limitedNodes;

  const now = new Date().toISOString();
  const nodes: GraphNode[] = paddedNodes.map((n, idx) => {
    const category = normalizeCategory(n.category);
    return {
      id: n.id ?? `node-${params.centerNodeId}-${idx}`,
      label: n.label ?? n.name ?? `Node ${idx + 1}`,
      category,
      categorySource: FIXED_CATEGORIES.includes(category) ? 'fixed' : 'llm',
      isExpanded: false,
      isCenter: false,
      position: randomPosition(240),
      metadata: {
        brief: n.brief ?? `Related to ${params.concept}`,
        generatedAt: now
      }
    };
  });

  // ensure at least 50% fixed categories
  const fixedNeeded = Math.ceil(nodes.length / 2);
  let fixedCount = nodes.filter((n) => n.categorySource === 'fixed').length;
  for (let i = 0; i < nodes.length && fixedCount < fixedNeeded; i++) {
    nodes[i].category = FIXED_CATEGORIES[i % FIXED_CATEGORIES.length];
    nodes[i].categorySource = 'fixed';
    fixedCount++;
  }

  const edges: GraphEdge[] = nodes.map((node, idx) => ({
    id: `edge-${node.id}-${idx}`,
    source: params.centerNodeId,
    target: node.id,
    label: nvl(parsed.nodes[idx]?.relationshipToSource, 'related to'),
    weight: 0.7
  }));

  return { nodes, edges };
}

export async function generateExplanationLLM(params: {
  label: string;
  category: string;
  mode: ExplorationMode;
  pathLabels: string[];
}): Promise<string | null> {
  if (!client) {
    throw new Error('Bedrock not configured');
  }

  const prompt = buildExplainPrompt(params);
  const response = await client.send(
    new InvokeModelCommand({
      modelId: BEDROCK_MODEL_ID!,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        anthropic_version: 'bedrock-2023-05-31',
        system: SYSTEM_EXPLAIN,
        max_tokens: 512,
        temperature: 0.6,
        messages: [{ role: 'user', content: [{ type: 'text', text: prompt }] }]
      })
    })
  );

  const parsed = parseBedrockJSON<{ explanation?: string }>(response.body);
  return parsed?.explanation ?? null;
}

function parseBedrockJSON<T>(body: any): T | null {
  try {
    const text = Buffer.from(body as Uint8Array).toString('utf-8');
    const json = JSON.parse(text);
    // Anthropic responses use "content"
    if (json?.content?.[0]?.text) {
      return JSON.parse(json.content[0].text) as T;
    }
    return json as T;
  } catch (err) {
    console.error('Failed to parse Bedrock JSON', err);
    return null;
  }
}

function buildExpandPrompt({
  concept,
  mode,
  explorationPathLabels
}: {
  concept: string;
  mode: ExplorationMode;
  explorationPathLabels: string[];
  centerNodeId: string;
}) {
  return `CONCEPT: ${concept}
MODE: ${mode}
EXPLORATION PATH: ${explorationPathLabels.join(' -> ') || 'N/A'}

Constraints:
- Generate 8-12 related entities.
- At least 50% must use fixed categories: ${FIXED_CATEGORIES.join(', ')}.
- Max 20 category types per expansion.
- Provide relationshipToSource (verb phrase) and brief.

Return JSON: { "nodes": [ { "label": "...", "category": "...", "categorySource": "fixed|llm", "brief": "...", "relationshipToSource": "..." } ] }`;
}

function buildExplainPrompt({
  label,
  category,
  mode,
  pathLabels
}: {
  label: string;
  category: string;
  mode: ExplorationMode;
  pathLabels: string[];
}) {
  return `CONCEPT: ${label}
CATEGORY: ${category}
MODE: ${mode}
PATH: ${pathLabels.join(' -> ')}

Write 150-300 words, start with the most important information, include 2-3 specific facts, and end with why it matters or links to broader themes.`;
}

function normalizeCategory(category: string) {
  if (!category) return 'Concept';
  const match = FIXED_CATEGORIES.find((c) => c.toLowerCase() === category.toLowerCase());
  return match ?? category;
}

function randomPosition(radius: number) {
  const angle = Math.random() * Math.PI * 2;
  const r = radius * Math.sqrt(Math.random());
  return { x: Math.round(Math.cos(angle) * r), y: Math.round(Math.sin(angle) * r) };
}

function nvl(value: string | undefined, fallback: string) {
  return value && value.trim().length > 0 ? value : fallback;
}
