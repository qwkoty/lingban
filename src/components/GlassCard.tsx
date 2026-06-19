import { cn } from '../lib/utils.js';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  hover?: boolean;
}

export function GlassCard({ children, className, hover = false, ...props }: GlassCardProps) {
  return (
    <div
      className={cn(
        'glass p-4 transition-all duration-300',
        hover && 'hover:bg-white/10 hover:scale-[1.01] cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
