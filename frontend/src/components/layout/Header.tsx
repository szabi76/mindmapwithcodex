import { useExplorationStore } from '../../state/explorationStore';

interface Props {
  animationPatterns: { id: string; label: string }[];
}

export function Header({ animationPatterns }: Props) {
  const { user, mode, setMode, animation, setAnimation } = useExplorationStore();

  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm px-6 py-3 flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-lg bg-indigo-500 flex items-center justify-center font-bold">MM</div>
        <div>
          <p className="font-semibold">MindMap Explorer</p>
          <p className="text-xs text-slate-400">AI-powered knowledge map</p>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <p className="text-sm text-slate-300">Mode</p>
          <select
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2"
            value={mode}
            onChange={(e) => setMode(e.target.value as typeof mode)}
          >
            <option value="contextual">Contextual</option>
            <option value="generic">Generic</option>
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <p className="text-sm text-slate-300">Animation</p>
          <select
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2"
            value={animation}
            onChange={(e) => setAnimation(e.target.value as typeof animation)}
          >
            {animationPatterns.map((pattern) => (
              <option key={pattern.id} value={pattern.id}>
                {pattern.label}
              </option>
            ))}
          </select>
        </div>

        <div className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200">
          {user}
        </div>
      </div>
    </header>
  );
}
