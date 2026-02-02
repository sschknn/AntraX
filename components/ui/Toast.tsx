
import React, { useEffect } from 'react';
import { Toast } from '../../types';

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemove }) => {
  return (
    <div className="fixed bottom-8 right-8 z-[2000] flex flex-col gap-3 pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: Toast, onRemove: (id: string) => void }> = ({ toast, onRemove }) => {
  useEffect(() => {
    const timer = setTimeout(() => onRemove(toast.id), 3000);
    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);

  const icons = {
    success: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />,
    info: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
    error: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
  };

  return (
    <div className="pointer-events-auto bg-slate-900/90 backdrop-blur-xl border border-white/10 px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-right duration-300">
      <div className={`w-6 h-6 rounded-full flex items-center justify-center 
        ${toast.type === 'success' ? 'bg-green-500/20 text-green-400' : 
          toast.type === 'error' ? 'bg-red-500/20 text-red-400' : 'bg-indigo-500/20 text-indigo-400'}
      `}>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {icons[toast.type]}
        </svg>
      </div>
      <span className="text-[10px] font-black text-white uppercase tracking-widest">{toast.message}</span>
    </div>
  );
};
