import { cn } from '@/lib/utils';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export function GlassCard({ children, className, hover = false, ...props }: GlassCardProps) {
  return (
    <div
      className={cn(
        'backdrop-blur-xl bg-white/10 border border-white/15 rounded-2xl shadow-lg',
        hover && 'transition-all duration-300 hover:bg-white/15 hover:border-white/20 hover:shadow-xl active:scale-[0.98]',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
