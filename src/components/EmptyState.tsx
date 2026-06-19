interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-4">
      {icon && <div className="mb-4 text-white/30">{icon}</div>}
      <h3 className="text-white/60 font-medium mb-1">{title}</h3>
      {description && <p className="text-white/40 text-sm mb-4">{description}</p>}
      {action}
    </div>
  );
}
