import { motion } from 'framer-motion';

interface Props {
  nodeId: string;
  label: string;
  x: number;
  y: number;
  onExplain: () => void;
  onExpand: () => void;
  onClose: () => void;
}

export function NodeActionMenu({ label, x, y, onExplain, onExpand, onClose }: Props) {
  return (
    <div className="absolute inset-0 pointer-events-none">
      <motion.div
        className="absolute pointer-events-auto"
        style={{ left: x, top: y, transform: 'translate(-50%, -50%)' }}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
      >
        <div className="relative w-40 h-40">
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="px-3 py-1 bg-slate-900/80 border border-slate-700 rounded-lg text-xs text-white">
              {label}
            </span>
          </div>
          <RadialButton label="Explain" onClick={onExplain} angle={-45} className="bg-indigo-500" />
          <RadialButton label="Expand" onClick={onExpand} angle={45} className="bg-emerald-500" />
          <RadialButton label="Close" onClick={onClose} angle={180} className="bg-slate-700" />
        </div>
      </motion.div>
    </div>
  );
}

function RadialButton({
  label,
  onClick,
  angle,
  className
}: {
  label: string;
  onClick: () => void;
  angle: number;
  className?: string;
}) {
  const radius = 60;
  const rad = (angle * Math.PI) / 180;
  const x = radius * Math.cos(rad);
  const y = radius * Math.sin(rad);
  return (
    <button
      className={`absolute text-xs text-white px-3 py-2 rounded-lg shadow-lg hover:opacity-90 ${className ?? ''}`}
      style={{ transform: `translate(${x}px, ${y}px)` }}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      {label}
    </button>
  );
}
