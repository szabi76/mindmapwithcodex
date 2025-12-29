import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useExplorationStore } from '../state/explorationStore';
import { GraphCanvas } from '../components/GraphCanvas';
import { ExplainModal } from '../components/ExplainModal';
import { LoginScreen } from '../components/LoginScreen';
import { Header } from '../components/layout/Header';
import { Sidebar } from '../components/layout/Sidebar';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { HistoryPanel } from '../components/HistoryPanel';

const animationPatterns = [
  { id: 'gentle-drift', label: 'Gentle Drift' },
  { id: 'static', label: 'Static' },
  { id: 'circular-orbit', label: 'Circular Orbit' },
  { id: 'constellation-pulse', label: 'Constellation Pulse' }
];

const AUTH_TOKENS: Record<string, string> = {
  owner: 'owner-demo-token',
  friends: 'friends-demo-token'
};

function App() {
  const { user, setUser, loading } = useExplorationStore();
  const [showExplain, setShowExplain] = useState(false);
  const [explanation, setExplanation] = useState<string>('');
  const [contextPath, setContextPath] = useState<string[]>([]);

  if (!user) {
    return <LoginScreen onSelect={(selection) => setUser(selection, AUTH_TOKENS[selection])} />;
  }

  return (
    <div className="min-h-screen text-white flex flex-col">
      <Header animationPatterns={animationPatterns} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          onShowExplanation={(text, path) => {
            setExplanation(text);
            setContextPath(path);
            setShowExplain(true);
          }}
        />
        <main className="flex-1 relative">
          <GraphCanvas
            onExplain={(text, path) => {
              setExplanation(text);
              setContextPath(path);
              setShowExplain(true);
            }}
          />
          <HistoryPanel />
        </main>
      </div>

      <AnimatePresence>
        {showExplain && (
          <ExplainModal
            explanation={explanation}
            contextPath={contextPath}
            onClose={() => setShowExplain(false)}
          />
        )}
      </AnimatePresence>
      <LoadingOverlay show={loading} />
    </div>
  );
}

export default App;
