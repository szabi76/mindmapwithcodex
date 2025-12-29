import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { requireAuth } from '../utils/auth.js';
import { badRequest, internalError, json } from '../utils/responses.js';
import { parseStart } from '../utils/validation.js';
import { createInitialExploration } from '../lib/graph.js';
import { saveExploration } from '../utils/db.js';

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    const { userId } = requireAuth(event);
    const payload = parseStart(event.body ?? null);
    if (!payload) return badRequest('Please enter a valid concept');

    const doc = await createInitialExploration(payload.concept.trim(), userId, payload.mode ?? 'contextual');
    await saveExploration(doc);

    return json(200, {
      explorationId: doc.explorationId,
      graph: doc.states[0].graph,
      stateIndex: 0
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    // @ts-expect-error statusCode optional
    if (error && typeof error === 'object' && error.statusCode === 401) {
      return json(401, { message: 'Session expired. Please log in again' });
    }
    console.error('start error', error);
    return internalError(message);
  }
};
