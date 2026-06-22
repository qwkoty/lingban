import { cn } from '../lib/utils';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function GlassCard({ children, className, ...props }: GlassCardProps) {
  return (
    <div
      className={cn(
        'rounded-3xl glass border border-white/10 shadow-xl transition-all duration-200 active:scale-[0.98]',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
