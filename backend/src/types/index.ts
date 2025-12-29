export type ExplorationMode = 'contextual' | 'generic';

export interface GraphNode {
  id: string;
  label: string;
  category: string;
  categorySource: 'fixed' | 'llm';
  isExpanded: boolean;
  isCenter: boolean;
  position: { x: number; y: number };
  metadata: {
    brief: string;
    generatedAt: string;
  };
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  weight: number;
}

export interface GraphState {
  nodes: GraphNode[];
  edges: GraphEdge[];
  centerNodeId: string;
  explorationPath: string[];
}

export interface ExplorationState {
  stateIndex: number;
  timestamp: string;
  expandedNodeId: string | null;
  graph: GraphState;
}

export interface ExplorationDocument {
  explorationId: string;
  userId: string;
  startingConcept: string;
  createdAt: string;
  updatedAt: string;
  mode: ExplorationMode;
  currentStateIndex: number;
  states: ExplorationState[];
  searchableTerms: string[];
}

export interface LambdaResponse {
  statusCode: number;
  headers?: Record<string, string>;
  body: string;
}

export interface AuthContext {
  userId: string;
}

export interface AnimationPattern {
  id: 'static' | 'gentle-drift' | 'circular-orbit' | 'constellation-pulse';
  label: string;
  description: string;
}

export interface StartExplorationPayload {
  concept: string;
  mode?: ExplorationMode;
}

export interface ExpandPayload {
  nodeId: string;
  mode?: ExplorationMode;
}

export interface ExplainPayload {
  nodeId: string;
  mode?: ExplorationMode;
}
