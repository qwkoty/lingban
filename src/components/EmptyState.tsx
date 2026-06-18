import { type ReactNode } from 'react'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 animate-fade-in">
      <div className="relative mb-6">
        <div className="absolute inset-0 aurora-gradient rounded-full blur-2xl opacity-20 animate-breathing" />
        <div className="relative w-24 h-24 rounded-4xl glass flex items-center justify-center animate-float">
          {icon || (
            <div className="w-12 h-12 rounded-full aurora-gradient opacity-60" />
          )}
        </div>
      </div>
      <h3 className="text-lg font-semibold text-white/80 mb-2 animate-fade-in-up" style={{ animationDelay: '100ms', opacity: 0 }}>{title}</h3>
      {description && (
        <p className="text-sm text-white/40 text-center max-w-xs animate-fade-in-up" style={{ animationDelay: '200ms', opacity: 0 }}>{description}</p>
      )}
      {action && <div className="mt-6 animate-fade-in-up" style={{ animationDelay: '300ms', opacity: 0 }}>{action}</div>}
    </div>
  )
}
