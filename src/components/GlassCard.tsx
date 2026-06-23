import { cn } from '../lib/utils';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function GlassCard({ children, className, onClick }: GlassCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'glass-card p-4 transition-all',
        onClick && 'cursor-pointer hover:bg-white/10 active:scale-[0.98]',
        className,
      )}
    >
      {children}
    </div>
  );
}
