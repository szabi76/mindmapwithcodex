import { useEffect, useState } from 'react';
import { useExplorationStore } from '../../state/explorationStore';
import { useMockApi } from '../../hooks/useMockApi';

interface Props {
  onShowExplanation: (text: string, path: string[]) => void;
}

export function Sidebar({ onShowExplanation }: Props) {
  const { mode, setMode, savedExplorations, setSavedExplorations, currentStateIndex } =
    useExplorationStore();
  const [concept, setConcept] = useState('');
  const [search, setSearch] = useState('');
  const [showBrowse, setShowBrowse] = useState(false);
  const api = useMockApi();

  useEffect(() => {
    api.listExplorations().then((items) => setSavedExplorations(items));
  }, [api, setSavedExplorations]);

  const start = async () => {
    if (!concept.trim()) return;
    await api.start(concept.trim());
    setConcept('');
  };

  return (
    <aside className="w-80 bg-slate-900 border-r border-slate-800 p-4 space-y-4 overflow-y-auto">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Explore</h2>
        <button
          className="text-xs text-slate-300 underline"
          onClick={() => setShowBrowse((v) => !v)}
        >
          {showBrowse ? 'New exploration' : 'Browse saved'}
        </button>
      </div>

      <div className="space-y-2">
        {!showBrowse ? (
          <>
            <p className="text-slate-300 text-sm">New Exploration</p>
            <input
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2"
              placeholder="Enter a concept"
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
            />
            <button className="button-primary w-full" onClick={start}>
              Start
            </button>
          </>
        ) : (
          <>
            <p className="text-slate-300 text-sm">Browse saved</p>
            <input
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2"
              placeholder="Search by concept/entity"
              value={search}
              onChange={async (e) => {
                const next = e.target.value;
                setSearch(next);
                const items = await api.listExplorations(next);
                setSavedExplorations(items);
              }}
            />
          </>
        )}
      </div>

      <div className="space-y-2">
        <p className="text-slate-300 text-sm">Mode</p>
        <div className="flex space-x-2">
          <button
            className={`button-primary flex-1 ${mode === 'contextual' ? '' : 'bg-slate-700 hover:bg-slate-600'}`}
            onClick={() => setMode('contextual')}
          >
            Contextual
          </button>
          <button
            className={`button-primary flex-1 ${mode === 'generic' ? '' : 'bg-slate-700 hover:bg-slate-600'}`}
            onClick={() => setMode('generic')}
          >
            Generic
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-slate-300 text-sm flex items-center justify-between">
          <span>Saved Explorations</span>
          <span className="text-xs text-slate-500">State: {currentStateIndex}</span>
        </p>
        <div className="space-y-2">
          {savedExplorations.map((item) => (
            <button
              key={item.explorationId}
              className="w-full text-left bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 hover:border-slate-500"
              onClick={async () => {
                await api.resume(item.explorationId);
                const explanation = await api.explainCurrentCenter();
                onShowExplanation(explanation.explanation, explanation.contextPath);
              }}
            >
              <div className="flex justify-between items-center">
                <p className="font-semibold">{item.startingConcept}</p>
                <button
                  className="text-xs text-rose-300 hover:text-rose-200 underline"
                  onClick={async (e) => {
                    e.stopPropagation();
                    await api.deleteExploration(item.explorationId);
                    const items = await api.listExplorations(search);
                    setSavedExplorations(items);
                  }}
                >
                  Delete
                </button>
              </div>
              {item.previewNodes && item.previewNodes.length > 0 && (
                <p className="text-slate-400 text-xs truncate">
                  Preview: {item.previewNodes.slice(0, 5).join(', ')}
                </p>
              )}
              {typeof item.nodeCount === 'number' && (
                <p className="text-slate-500 text-xs">Nodes: {item.nodeCount}</p>
              )}
              <p className="text-slate-400 text-xs">Updated {new Date(item.updatedAt).toLocaleString()}</p>
            </button>
          ))}
          {savedExplorations.length === 0 && <p className="text-slate-500 text-sm">No explorations yet.</p>}
        </div>
      </div>
    </aside>
  );
}
