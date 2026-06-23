'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function Modal({ open, onClose, title, children, className }: ModalProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (open) {
      window.addEventListener('keydown', handleKey);
    }
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={cn(
          'relative z-10 w-full sm:max-w-md bg-card border-t sm:border border-border sm:rounded-2xl rounded-t-2xl p-6 max-h-[85vh] overflow-y-auto animate-slide-up',
          className
        )}
      >
        {title && (
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">{title}</h3>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
            >
              <X size={20} />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
