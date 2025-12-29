import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { requireAuth } from '../utils/auth.js';
import { badRequest, internalError, json } from '../utils/responses.js';
import { listExplorationsForUser } from '../utils/db.js';

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    const { userId } = requireAuth(event);
    const search = event.queryStringParameters?.search;

    const explorations = await listExplorationsForUser(userId, search);
    return json(200, {
      explorations: explorations.map((exploration) => {
        const previewNodes = exploration.states[exploration.currentStateIndex].graph.nodes
          .slice(0, 5)
          .map((n) => n.label);
        return {
          explorationId: exploration.explorationId,
          startingConcept: exploration.startingConcept,
          nodeCount: exploration.states[exploration.currentStateIndex].graph.nodes.length,
          updatedAt: exploration.updatedAt,
          previewNodes
        };
      })
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    // @ts-expect-error statusCode optional
    if (error && typeof error === 'object' && error.statusCode === 401) {
      return json(401, { message: 'Session expired. Please log in again' });
    }
    console.error('list error', error);
    return internalError(message);
  }
};
