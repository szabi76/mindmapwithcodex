import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  show: boolean;
}

export function LoadingOverlay({ show }: Props) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-slate-900/90 border border-slate-700 rounded-xl px-5 py-3 text-slate-100"
            animate={{ scale: [0.98, 1.02, 0.98] }}
            transition={{ duration: 1.4, repeat: Infinity }}
          >
            Generating ontology...
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
