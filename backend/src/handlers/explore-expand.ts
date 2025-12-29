import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { requireAuth } from '../utils/auth.js';
import { badRequest, internalError, json, notFound } from '../utils/responses.js';
import { parseExpand } from '../utils/validation.js';
import { getExploration, updateExplorationState } from '../utils/db.js';
import { mergeExpansion } from '../lib/graph.js';

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    const { userId } = requireAuth(event);
    const explorationId = event.pathParameters?.explorationId;
    if (!explorationId) return badRequest('Exploration id is required');

    const payload = parseExpand(event.body ?? null);
    if (!payload) return badRequest('Invalid input');

    const doc = await getExploration(explorationId);
    if (!doc || doc.userId !== userId) return notFound("Exploration not found");

    const updated = await mergeExpansion(doc, payload.nodeId, payload.mode ?? doc.mode);
    await updateExplorationState(updated);

    const latest = updated.states[updated.currentStateIndex];
    const newNodes = latest.graph.nodes.slice(doc.states[doc.currentStateIndex].graph.nodes.length);
    const newEdges = latest.graph.edges.slice(doc.states[doc.currentStateIndex].graph.edges.length);

    return json(200, {
      graph: latest.graph,
      stateIndex: latest.stateIndex,
      newNodes,
      newEdges
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    // @ts-expect-error statusCode optional
    if (error && typeof error === 'object' && error.statusCode === 401) {
      return json(401, { message: 'Session expired. Please log in again' });
    }
    console.error('expand error', error);
    return internalError(message);
  }
};
