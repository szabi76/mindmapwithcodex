import { useExplorationStore } from '../state/explorationStore';
import { useMockApi } from '../hooks/useMockApi';

export function HistoryPanel() {
  const { history, currentStateIndex } = useExplorationStore();
  const api = useMockApi();

  if (!history.length) return null;

  return (
    <div className="bg-slate-900 border-t border-slate-800 px-4 py-3 flex items-center space-x-3">
      <p className="text-slate-300 text-sm">History</p>
      <div className="flex space-x-2 overflow-x-auto">
        {history.map((item, idx) => (
          <button
            key={item.nodeId}
            className={`px-3 py-1 rounded-lg text-xs border ${
              idx === currentStateIndex ? 'border-indigo-400 bg-indigo-500/20' : 'border-slate-700 bg-slate-800'
            }`}
            onClick={() => api.loadState(idx)}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
