import axios from 'axios';
import { useExplorationStore } from '../state/explorationStore';

const API_URL = import.meta.env.VITE_API_URL;

export function useMockApi() {
  const {
    token,
    setGraph,
    setLoading,
    mode,
    setHistory,
    explorationId,
    setExplorationId,
    setCurrentStateIndex
  } = useExplorationStore();

  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  const start = async (concept: string) => {
    setLoading(true);
    try {
      if (API_URL) {
        const response = await axios.post(
          `${API_URL}/explore/start`,
          { concept, mode },
          { headers }
        );
        setGraph(response.data.graph);
        setHistory(buildHistory(response.data.graph));
        setExplorationId(response.data.explorationId);
        setCurrentStateIndex(response.data.stateIndex ?? 0);
        return;
      }

      // fallback mock
      const mockGraph = buildMockGraph(concept);
      setGraph(mockGraph);
      setHistory(buildHistory(mockGraph));
      setExplorationId('mock-exploration');
      setCurrentStateIndex(0);
    } finally {
      setLoading(false);
    }
  };

  const expand = async (nodeId: string) => {
    setLoading(true);
    try {
      if (API_URL) {
        if (!explorationId) throw new Error('Missing exploration id');
        const response = await axios.post(
          `${API_URL}/explore/${explorationId}/expand`,
          { nodeId, mode },
          { headers }
        );
        setGraph(response.data.graph);
        setHistory(buildHistory(response.data.graph));
        setCurrentStateIndex(response.data.stateIndex ?? 0);
        return response.data;
      }

      // mock expansion
      setGraph((prev) => (prev ? mockExpand(prev, nodeId) : prev));
    } finally {
      setLoading(false);
    }
  };

  const explain = async (nodeId: string) => {
    if (API_URL) {
      if (!explorationId) throw new Error('Missing exploration id');
      const response = await axios.post(
        `${API_URL}/explore/${explorationId}/explain`,
        { nodeId, mode },
        { headers }
      );
      return response.data;
    }

    return {
      explanation: `${nodeId} is a pivotal concept in this path.`,
      contextPath: ['Start', nodeId]
    };
  };

  const explainCurrentCenter = async () => {
    const storeGraph = useExplorationStore.getState().graph;
    const center = storeGraph?.nodes.find((n) => n.id === storeGraph.centerNodeId);
    return explain(center?.id ?? 'center');
  };

  const resume = async (explorationId: string) => {
    if (API_URL) {
      const response = await axios.get(`${API_URL}/explore/${explorationId}/state/0`, { headers });
      setGraph(response.data.graph);
      setHistory(buildHistory(response.data.graph));
      setExplorationId(explorationId);
      setCurrentStateIndex(response.data.stateIndex ?? 0);
      return;
    }

    setGraph(buildMockGraph('Resumed exploration'));
    setExplorationId(explorationId);
    setCurrentStateIndex(0);
  };

  const listExplorations = async (search?: string) => {
    if (API_URL) {
      const response = await axios.get(`${API_URL}/explorations`, {
        headers,
        params: search ? { search } : undefined
      });
      return response.data.explorations as {
        explorationId: string;
        startingConcept: string;
        updatedAt: string;
        previewNodes?: string[];
        nodeCount?: number;
      }[];
    }

    return [
      { explorationId: 'demo-1', startingConcept: 'French Revolution', updatedAt: new Date().toISOString() }
    ];
  };

  const deleteExploration = async (explorationId: string) => {
    if (API_URL) {
      await axios.delete(`${API_URL}/explorations/${explorationId}`, { headers });
    }
    return;
  };

  const loadState = async (index: number) => {
    if (API_URL && explorationId) {
      const response = await axios.get(`${API_URL}/explore/${explorationId}/state/${index}`, { headers });
      setGraph(response.data.graph);
      setHistory(buildHistory(response.data.graph));
      setCurrentStateIndex(response.data.stateIndex ?? index);
      return;
    }
  };

  return { start, expand, explain, explainCurrentCenter, resume, listExplorations, deleteExploration, loadState };
}

function buildHistory(graph: any) {
  return graph.explorationPath.map((id: string) => {
    const label = graph.nodes.find((n: any) => n.id === id)?.label ?? id;
    return { label, nodeId: id };
  });
}

function buildMockGraph(concept: string) {
  const nodes = Array.from({ length: 8 }).map((_, i) => ({
    id: `node-${i + 1}`,
    label: `${concept} related ${i + 1}`,
    category: 'Concept',
    isExpanded: false,
    position: { x: i * 40, y: i * 10 }
  }));

  return {
    nodes: [
      { id: 'center', label: concept, category: 'Concept', isExpanded: true, position: { x: 0, y: 0 } },
      ...nodes
    ],
    edges: nodes.map((node) => ({
      id: `edge-${node.id}`,
      source: 'center',
      target: node.id,
      label: 'related to'
    })),
    centerNodeId: 'center',
    explorationPath: ['center']
  };
}

function mockExpand(graph: any, nodeId: string) {
  const newNodes = Array.from({ length: 3 }).map((_, i) => ({
    id: `${nodeId}-child-${i}`,
    label: `${graph.nodes.find((n: any) => n.id === nodeId)?.label} child ${i + 1}`,
    category: 'Concept',
    isExpanded: false,
    position: { x: Math.random() * 200, y: Math.random() * 200 }
  }));

  return {
    ...graph,
    nodes: [...graph.nodes, ...newNodes],
    edges: [
      ...graph.edges,
      ...newNodes.map((n: any) => ({ id: `edge-${n.id}`, source: nodeId, target: n.id, label: 'related' }))
    ],
    centerNodeId: nodeId,
    explorationPath: [...graph.explorationPath, nodeId]
  };
}
