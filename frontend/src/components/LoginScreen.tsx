interface Props {
  onSelect: (user: 'owner' | 'friends') => void;
}

export function LoginScreen({ onSelect }: Props) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="card p-8 w-full max-w-md text-center space-y-6">
        <h1 className="text-2xl font-semibold">MindMap Explorer</h1>
        <p className="text-slate-300">Select a demo account to start exploring.</p>
        <div className="space-y-3">
          <button className="button-primary w-full" onClick={() => onSelect('owner')}>
            Sign in as Owner
          </button>
          <button className="button-primary w-full bg-emerald-500 hover:bg-emerald-400" onClick={() => onSelect('friends')}>
            Sign in as Friends
          </button>
        </div>
      </div>
    </div>
  );
}
