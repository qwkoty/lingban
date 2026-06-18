import { type ReactNode } from 'react'
import { cn } from '../lib/utils'

interface GlassCardProps {
  children: ReactNode
  className?: string
  onClick?: () => void
  strong?: boolean
}

export default function GlassCard({ children, className, onClick, strong }: GlassCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        strong ? 'glass-strong' : 'glass',
        'transition-all duration-400',
        onClick && 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]',
        className,
      )}
      style={{ transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }}
    >
      {children}
    </div>
  )
}
