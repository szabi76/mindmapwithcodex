import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { requireAuth } from '../utils/auth.js';
import { badRequest, internalError, json, notFound } from '../utils/responses.js';
import { getExploration, updateCurrentStateIndex } from '../utils/db.js';
import { getState } from '../lib/graph.js';

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    const { userId } = requireAuth(event);
    const explorationId = event.pathParameters?.explorationId;
    const stateIndexStr = event.pathParameters?.stateIndex;
    if (!explorationId || !stateIndexStr) return badRequest('Exploration id and state index are required');

    const stateIndex = Number(stateIndexStr);
    if (Number.isNaN(stateIndex) || stateIndex < 0) return badRequest('Invalid state index');

    const doc = await getExploration(explorationId);
    if (!doc || doc.userId !== userId) return notFound('Exploration not found');

    const state = getState(doc, stateIndex);
    if (!state) return notFound('State not found');

    const updatedAt = new Date().toISOString();
    await updateCurrentStateIndex(explorationId, stateIndex, updatedAt);

    return json(200, {
      graph: state.graph,
      stateIndex: state.stateIndex
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    // @ts-expect-error statusCode optional
    if (error && typeof error === 'object' && error.statusCode === 401) {
      return json(401, { message: 'Session expired. Please log in again' });
    }
    console.error('state error', error);
    return internalError(message);
  }
};
