import { nanoid } from 'nanoid';
import {
  ExplorationDocument,
  ExplorationMode,
  ExplorationState,
  GraphEdge,
  GraphNode,
  GraphState
} from '../types/index.js';
import { generateExplanationLLM, generateOntologyLLM } from './llm.js';

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

interface GenerateOptions {
  sourceLabel: string;
  mode: ExplorationMode;
  explorationPath: string[];
  centerNodeId?: string;
}

const RELATIONSHIPS = [
  'influenced',
  'led to',
  'opposed',
  'created',
  'expanded',
  'sparked',
  'emerged from',
  'connected with',
  'preceded',
  'developed from'
];

export async function createInitialExploration(
  concept: string,
  userId: string,
  mode: ExplorationMode
): Promise<ExplorationDocument> {
  const centerNode: GraphNode = {
    id: `node-${nanoid(8)}`,
    label: concept,
    category: 'Concept',
    categorySource: 'fixed',
    isExpanded: false,
    isCenter: true,
    position: { x: 0, y: 0 },
    metadata: {
      brief: `${concept} starting point`,
      generatedAt: new Date().toISOString()
    }
  };

  const generated =
    (await generateOntologyLLM({
      concept,
      mode,
      explorationPathLabels: [concept],
      centerNodeId: centerNode.id
    })) ??
    generateRelatedNodes({
      sourceLabel: concept,
      mode,
      explorationPath: [centerNode.id],
      centerNodeId: centerNode.id
    });

  const graph: GraphState = {
    nodes: [centerNode, ...generated.nodes],
    edges: generated.edges,
    centerNodeId: centerNode.id,
    explorationPath: [centerNode.id]
  };

  const initialState: ExplorationState = {
    stateIndex: 0,
    timestamp: new Date().toISOString(),
    expandedNodeId: null,
    graph
  };

  return {
    explorationId: nanoid(12),
    userId,
    startingConcept: concept,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    mode,
    currentStateIndex: 0,
    states: [initialState],
    searchableTerms: [concept.toLowerCase(), ...generated.nodes.map((n) => n.label.toLowerCase())]
  };
}

export function generateRelatedNodes({
  sourceLabel,
  mode,
  explorationPath,
  centerNodeId
}: GenerateOptions): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const now = new Date().toISOString();
  const count = 8 + Math.floor(Math.random() * 5);
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  for (let i = 0; i < count; i++) {
    const category = FIXED_CATEGORIES[i % FIXED_CATEGORIES.length];
    const nodeId = `node-${nanoid(8)}`;
    nodes.push({
      id: nodeId,
      label: `${sourceLabel} ${mode === 'contextual' ? 'context' : 'theme'} ${i + 1}`,
      category,
      categorySource: 'fixed',
      isExpanded: false,
      isCenter: false,
      position: randomPosition(centerNodeId ? 260 : 200),
      metadata: {
        brief: `${category} linked to ${sourceLabel}`,
        generatedAt: now
      }
    });

    edges.push({
      id: `edge-${nanoid(8)}`,
      source: centerNodeId ?? nodeId,
      target: nodeId,
      label: RELATIONSHIPS[i % RELATIONSHIPS.length],
      weight: Math.round((Math.random() * 0.5 + 0.5) * 100) / 100
    });
  }

  return { nodes, edges };
}

export async function mergeExpansion(
  doc: ExplorationDocument,
  expandedNodeId: string,
  mode: ExplorationMode
): Promise<ExplorationDocument> {
  const currentState = doc.states[doc.currentStateIndex];
  const expandedNode = currentState.graph.nodes.find((n) => n.id === expandedNodeId);
  if (!expandedNode) {
    throw new Error('Expanded node not found');
  }

  const explorationPath = [...currentState.graph.explorationPath, expandedNodeId];
  const generated =
    (await generateOntologyLLM({
      concept: expandedNode.label,
      mode,
      explorationPathLabels: explorationPath
        .map((id) => currentState.graph.nodes.find((n) => n.id === id)?.label || id),
      centerNodeId: expandedNodeId
    })) ??
    generateRelatedNodes({
      sourceLabel: expandedNode.label,
      mode,
      explorationPath,
      centerNodeId: expandedNodeId
    });

  const updatedNodes = currentState.graph.nodes.map((node) =>
    node.id === expandedNodeId ? { ...node, isExpanded: true, isCenter: true } : { ...node, isCenter: false }
  );

  const graph: GraphState = {
    nodes: [...updatedNodes, ...generated.nodes],
    edges: [...currentState.graph.edges, ...generated.edges],
    centerNodeId: expandedNodeId,
    explorationPath
  };

  const newStateIndex = doc.currentStateIndex + 1;
  const newState: ExplorationState = {
    stateIndex: newStateIndex,
    timestamp: new Date().toISOString(),
    expandedNodeId,
    graph
  };

  const newDoc: ExplorationDocument = {
    ...doc,
    mode,
    currentStateIndex: newStateIndex,
    updatedAt: newState.timestamp,
    states: [...doc.states.slice(0, doc.currentStateIndex + 1), newState],
    searchableTerms: Array.from(
      new Set([
        ...doc.searchableTerms,
        expandedNode.label.toLowerCase(),
        ...generated.nodes.map((n) => n.label.toLowerCase())
      ])
    )
  };

  return newDoc;
}

export function getState(doc: ExplorationDocument, index: number) {
  return doc.states.find((state) => state.stateIndex === index) ?? null;
}

export function buildExplanation(
  nodeLabel: string,
  category: string,
  mode: ExplorationMode,
  pathLabels: string[]
): string {
  const intro = `${nodeLabel} is a ${category.toLowerCase()} connected to this exploration.`;
  const contextLine =
    mode === 'contextual'
      ? `This summary highlights its role along the path ${pathLabels.join(' → ')}.`
      : 'This summary focuses on the concept in isolation.';
  const details =
    'Key notes: it relates to nearby nodes, illustrates the broader theme, and offers a pivot for further expansion.';
  const closing = 'It matters because it helps connect adjacent ideas and keeps the exploration evolving.';
  return `${intro} ${contextLine} ${details} ${closing}`;
}

function randomPosition(radius: number) {
  const angle = Math.random() * Math.PI * 2;
  const r = radius * Math.sqrt(Math.random());
  return { x: Math.round(Math.cos(angle) * r), y: Math.round(Math.sin(angle) * r) };
}
