import { Bot } from 'lucide-react'
import { cn } from '../lib/utils'

interface AvatarProps {
  src?: string | null
  name?: string
  size?: number
  className?: string
}

// 根据名字生成渐变色
function getGradient(name: string): string {
  const gradients = [
    'from-aurora-blue to-aurora-cyan',
    'from-aurora-cyan to-aurora-green',
    'from-aurora-green to-aurora-yellow',
    'from-aurora-yellow to-aurora-orange',
    'from-aurora-orange to-aurora-pink',
    'from-aurora-pink to-aurora-purple',
    'from-aurora-purple to-aurora-blue',
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return gradients[Math.abs(hash) % gradients.length]
}

export default function Avatar({ src, name = '?', size = 48, className }: AvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn('rounded-2xl object-cover', className)}
        style={{ width: size, height: size }}
      />
    )
  }

  const initial = name.charAt(0).toUpperCase()
  const gradient = getGradient(name)

  return (
    <div
      className={cn(
        'rounded-2xl flex items-center justify-center bg-gradient-to-br font-semibold text-white/90',
        gradient,
        className,
      )}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {initial || <Bot size={size * 0.5} />}
    </div>
  )
}
