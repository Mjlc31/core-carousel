import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  type?: ToastType;
  isVisible: boolean;
  onClose: () => void;
}

export default function Toast({ message, type = 'info', isVisible, onClose }: ToastProps) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-core-neon" />,
    error: <AlertCircle className="w-5 h-5 text-red-500" />,
    info: <Info className="w-5 h-5 text-blue-400" />
  };

  const colors = {
    success: 'border-core-neon/20 bg-core-neon/5',
    error: 'border-red-500/20 bg-red-500/5',
    info: 'border-blue-400/20 bg-blue-400/5'
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: 20, x: '-50%' }}
          className={`fixed bottom-8 left-1/2 z-[300] flex items-center gap-4 px-6 py-4 glass border-2 shadow-2xl min-w-[320px] max-w-[90vw] ${colors[type]}`}
        >
          <div className="flex-shrink-0">{icons[type]}</div>
          <div className="flex-1 text-sm font-black uppercase tracking-tight italic text-white/90">
            {message}
          </div>
          <button 
            onClick={onClose}
            className="flex-shrink-0 p-1 hover:bg-white/10 transition-colors rounded"
          >
            <X className="w-4 h-4 text-white/40" />
          </button>
          
          <motion.div 
            initial={{ width: '100%' }}
            animate={{ width: '0%' }}
            transition={{ duration: 5, ease: 'linear' }}
            className={`absolute bottom-0 left-0 h-1 ${
              type === 'success' ? 'bg-core-neon' : 
              type === 'error' ? 'bg-red-500' : 'bg-blue-400'
            }`}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
