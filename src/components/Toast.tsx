import { useToastStore } from '../store/toast';
import { cn } from '../lib/utils';

export function ToastContainer() {
  const { toasts, dismiss } = useToastStore();

  return (
    <div className="fixed top-4 left-0 right-0 z-[60] flex flex-col items-center gap-2 px-4 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          onClick={() => dismiss(t.id)}
          className={cn(
            'pointer-events-auto px-4 py-3 rounded-xl glass text-sm max-w-sm w-full text-center animate-fade-in-up',
            t.type === 'error' && 'border-red-500/30 text-red-200',
            t.type === 'success' && 'border-green-500/30 text-green-200',
            t.type === 'info' && 'text-white/90',
          )}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
