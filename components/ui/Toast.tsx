// components/ui/Toast.tsx
'use client';
import { useToast } from '@/contexts/ToastContext';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

export function ToastContainer() {
  const { toasts, dismissToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[200] flex flex-col gap-2 max-w-sm">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className="flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg"
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-md)',
            animation: 'slideInRight 0.3s ease',
          }}
        >
          {toast.type === 'success' && <CheckCircle size={18} style={{ color: '#22c55e', flexShrink: 0 }} />}
          {toast.type === 'error' && <XCircle size={18} style={{ color: '#ef4444', flexShrink: 0 }} />}
          {toast.type === 'info' && <Info size={18} style={{ color: 'var(--color-brand)', flexShrink: 0 }} />}
          <span className="text-sm font-medium flex-1" style={{ color: 'var(--text-primary)' }}>
            {toast.message}
          </span>
          <button
            onClick={() => dismissToast(toast.id)}
            className="p-0.5 rounded transition-colors"
            style={{ color: 'var(--text-muted)' }}
          >
            <X size={14} />
          </button>
        </div>
      ))}

      <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(100%); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}