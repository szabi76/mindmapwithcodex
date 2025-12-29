import { motion } from 'framer-motion';

interface Props {
  explanation: string;
  contextPath: string[];
  onClose: () => void;
}

export function ExplainModal({ explanation, contextPath, onClose }: Props) {
  return (
    <motion.div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="card p-6 max-w-2xl w-full text-left"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <div>
            <p className="text-slate-400 text-sm">Context Path</p>
            <p className="font-semibold">{contextPath.join(' → ')}</p>
          </div>
          <button className="text-slate-300 hover:text-white" onClick={onClose}>
            ✕
          </button>
        </div>
        <p className="text-slate-200 leading-relaxed whitespace-pre-line">{explanation}</p>
      </motion.div>
    </motion.div>
  );
}
