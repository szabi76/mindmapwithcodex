import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { requireAuth } from '../utils/auth.js';
import { badRequest, internalError, json, notFound } from '../utils/responses.js';
import { parseExplain } from '../utils/validation.js';
import { getExploration } from '../utils/db.js';
import { buildExplanation } from '../lib/graph.js';
import { generateExplanationLLM } from '../lib/llm.js';

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    const { userId } = requireAuth(event);
    const explorationId = event.pathParameters?.explorationId;
    if (!explorationId) return badRequest('Exploration id is required');
    const payload = parseExplain(event.body ?? null);
    if (!payload) return badRequest('Invalid input');

    const doc = await getExploration(explorationId);
    if (!doc || doc.userId !== userId) return notFound('Exploration not found');

    const currentGraph = doc.states[doc.currentStateIndex].graph;
    const node = currentGraph.nodes.find((n) => n.id === payload.nodeId);
    if (!node) return notFound('Node not found');

    const pathLabels = currentGraph.explorationPath
      .map((id) => currentGraph.nodes.find((n) => n.id === id)?.label || 'Unknown')
      .filter(Boolean);

    const explanation =
      (await generateExplanationLLM({
        label: node.label,
        category: node.category,
        mode: payload.mode ?? doc.mode,
        pathLabels
      })) ?? buildExplanation(node.label, node.category, payload.mode ?? doc.mode, pathLabels);
    return json(200, {
      explanation,
      contextPath: pathLabels
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    // @ts-expect-error statusCode optional
    if (error && typeof error === 'object' && error.statusCode === 401) {
      return json(401, { message: 'Session expired. Please log in again' });
    }
    console.error('explain error', error);
    return internalError(message);
  }
};
