import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { requireAuth } from '../utils/auth.js';
import { badRequest, internalError, json, notFound } from '../utils/responses.js';
import { deleteExploration, getExploration } from '../utils/db.js';

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    const { userId } = requireAuth(event);
    const explorationId = event.pathParameters?.explorationId;
    if (!explorationId) return badRequest('Exploration id is required');

    const doc = await getExploration(explorationId);
    if (!doc || doc.userId !== userId) return notFound("Exploration not found");

    await deleteExploration(explorationId);
    return json(200, { deleted: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    // @ts-expect-error statusCode optional
    if (error && typeof error === 'object' && error.statusCode === 401) {
      return json(401, { message: 'Session expired. Please log in again' });
    }
    console.error('delete error', error);
    return internalError(message);
  }
};
