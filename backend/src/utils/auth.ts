import { APIGatewayProxyEventV2 } from 'aws-lambda';
import { AuthContext } from '../types/index.js';

const { AUTH_TOKEN_OWNER, AUTH_TOKEN_FRIENDS } = process.env;

export function requireAuth(event: APIGatewayProxyEventV2): AuthContext {
  const header = event.headers?.authorization || event.headers?.Authorization;
  if (!header || !header.startsWith('Bearer ')) {
    throw unauthorized('Missing or invalid Authorization header');
  }

  const token = header.replace('Bearer ', '').trim();
  if (token && token === AUTH_TOKEN_OWNER) {
    return { userId: 'owner' };
  }
  if (token && token === AUTH_TOKEN_FRIENDS) {
    return { userId: 'friends' };
  }

  throw unauthorized('Invalid token');
}

export function unauthorized(message: string) {
  const error = new Error(message);
  // @ts-expect-error custom code
  error.statusCode = 401;
  return error;
}
