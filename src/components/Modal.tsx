import { type ReactNode, useEffect } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}

export default function Modal({ open, onClose, title, children }: ModalProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
      {/* 遮罩 */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* 弹窗内容 - 从底部滑入 */}
      <div className="relative w-full max-w-[480px] max-h-[85vh] flex flex-col glass-strong rounded-t-4xl sm:rounded-4xl overflow-hidden animate-slide-up">
        {/* 顶部抓手 */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {/* 标题栏 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <h2 className="text-lg font-semibold font-display text-white/90">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-2xl glass text-white/50 hover:text-white/90 transition-all active:scale-90"
          >
            <X size={18} />
          </button>
        </div>

        {/* 内容区 */}
        <div className="flex-1 overflow-y-auto px-5 py-5" style={{ scrollbarWidth: 'none' }}>
          {children}
        </div>
      </div>
    </div>
  )
}
