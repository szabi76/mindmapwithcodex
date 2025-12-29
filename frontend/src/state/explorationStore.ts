import { create } from 'zustand';

export type Mode = 'contextual' | 'generic';
export type AnimationPattern = 'static' | 'gentle-drift' | 'circular-orbit' | 'constellation-pulse';

export interface GraphNode {
  id: string;
  label: string;
  category: string;
  isExpanded: boolean;
  position?: { x: number; y: number };
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label: string;
}

export interface GraphState {
  nodes: GraphNode[];
  edges: GraphEdge[];
  centerNodeId: string;
  explorationPath: string[];
}

interface ExplorationState {
  user: 'owner' | 'friends' | null;
  token: string | null;
  mode: Mode;
  animation: AnimationPattern;
  loading: boolean;
  graph?: GraphState;
  history: { label: string; nodeId: string }[];
  currentStateIndex: number;
  explorationId?: string;
  savedExplorations: {
    explorationId: string;
    startingConcept: string;
    updatedAt: string;
    previewNodes?: string[];
    nodeCount?: number;
  }[];
  setUser: (user: 'owner' | 'friends', token: string) => void;
  setMode: (mode: Mode) => void;
  setAnimation: (animation: AnimationPattern) => void;
  setGraph: (graph: GraphState | ((graph?: GraphState) => GraphState | undefined)) => void;
  setLoading: (loading: boolean) => void;
  setHistory: (history: { label: string; nodeId: string }[]) => void;
  setCurrentStateIndex: (index: number) => void;
  setExplorationId: (id?: string) => void;
  setSavedExplorations: (
    items: { explorationId: string; startingConcept: string; updatedAt: string }[]
  ) => void;
}

export const useExplorationStore = create<ExplorationState>((set) => ({
  user: null,
  token: null,
  mode: 'contextual',
  animation: 'gentle-drift',
  loading: false,
  history: [],
  currentStateIndex: 0,
  explorationId: undefined,
  savedExplorations: [],
  setUser: (user, token) => set({ user, token }),
  setMode: (mode) => set({ mode }),
  setAnimation: (animation) => set({ animation }),
  setGraph: (graph) =>
    set((state) => ({
      graph: typeof graph === 'function' ? graph(state.graph) : graph
    })),
  setLoading: (loading) => set({ loading }),
  setHistory: (history) => set({ history }),
  setCurrentStateIndex: (index) => set({ currentStateIndex: index }),
  setExplorationId: (id) => set({ explorationId: id }),
  setSavedExplorations: (items) => set({ savedExplorations: items })
}));
