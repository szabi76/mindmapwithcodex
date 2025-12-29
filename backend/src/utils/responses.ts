import { LambdaResponse } from '../types/index.js';

export function json(statusCode: number, payload: unknown): LambdaResponse {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization'
    },
    body: JSON.stringify(payload)
  };
}

export function badRequest(message: string) {
  return json(400, { message });
}

export function forbidden(message: string) {
  return json(403, { message });
}

export function notFound(message: string) {
  return json(404, { message });
}

export function internalError(message: string) {
  return json(500, { message });
}
