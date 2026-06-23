import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center text-center py-16 px-8', className)}>
      <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-4 text-muted-foreground">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground max-w-xs mb-6">{description}</p>
      )}
      {action}
    </div>
  );
}
