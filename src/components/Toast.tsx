'use client';

import { CheckCircle2, XCircle, Info, X } from 'lucide-react';
import { useToastStore } from '@/store/toast';
import { cn } from '@/lib/utils';

export function ToastContainer() {
  const { toasts, dismiss } = useToastStore();

  const icons = {
    success: <CheckCircle2 size={20} className="text-green-400" />,
    error: <XCircle size={20} className="text-red-400" />,
    info: <Info size={20} className="text-blue-400" />,
  };

  return (
    <div className="fixed top-4 right-4 left-4 sm:left-auto z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            'pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl backdrop-blur-xl bg-card/95 border border-border shadow-lg animate-slide-in',
            'min-w-0 sm:min-w-[280px]'
          )}
        >
          {icons[toast.type]}
          <p className="flex-1 text-sm text-foreground truncate">{toast.message}</p>
          <button
            onClick={() => dismiss(toast.id)}
            className="p-1 rounded-md hover:bg-muted transition-colors text-muted-foreground flex-shrink-0"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}
