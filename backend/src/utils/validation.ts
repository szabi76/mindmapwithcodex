import { ExpandPayload, ExplainPayload, ExplorationMode, StartExplorationPayload } from '../types/index.js';

export function parseStart(body: string | null): StartExplorationPayload | null {
  if (!body) return null;
  try {
    const payload = JSON.parse(body) as StartExplorationPayload;
    if (!payload.concept || payload.concept.trim().length === 0 || payload.concept.length > 200) {
      return null;
    }
    payload.mode = normalizeMode(payload.mode);
    return payload;
  } catch {
    return null;
  }
}

export function parseExpand(body: string | null): ExpandPayload | null {
  if (!body) return null;
  try {
    const payload = JSON.parse(body) as ExpandPayload;
    if (!payload.nodeId || payload.nodeId.trim().length === 0) return null;
    payload.mode = normalizeMode(payload.mode);
    return payload;
  } catch {
    return null;
  }
}

export function parseExplain(body: string | null): ExplainPayload | null {
  if (!body) return null;
  try {
    const payload = JSON.parse(body) as ExplainPayload;
    if (!payload.nodeId || payload.nodeId.trim().length === 0) return null;
    payload.mode = normalizeMode(payload.mode);
    return payload;
  } catch {
    return null;
  }
}

function normalizeMode(mode?: ExplorationMode): ExplorationMode {
  return mode === 'generic' ? 'generic' : 'contextual';
}
