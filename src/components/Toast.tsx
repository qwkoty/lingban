import { useToastStore } from '../store/toast';
import { cn } from '../lib/utils';

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            'px-4 py-2 rounded-2xl text-sm font-medium shadow-lg backdrop-blur-xl border pointer-events-auto animate-fade-in-up',
            toast.type === 'error' && 'bg-red-500/20 border-red-500/30 text-red-100',
            toast.type === 'success' && 'bg-emerald-500/20 border-emerald-500/30 text-emerald-100',
            toast.type === 'info' && 'bg-white/10 border-white/20 text-white'
          )}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}
