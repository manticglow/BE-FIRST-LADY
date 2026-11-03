/**
 * Modal — بطاقة حوار موحّدة
 * ═══════════════════════════════════════════════════════════
 * - Overlay مع blur + animation
 * - 5 مقاسات (xs/sm/md/lg/xl)
 * - ESC + click خارج يغلق · scroll lock
 * - Portal لتفادي z-index conflicts
 * - focus trap على الـcontainer
 *
 * Usage:
 *   <Modal open={open} onClose={() => setOpen(false)} title="عنوان">
 *     <div>المحتوى</div>
 *   </Modal>
 *
 *   <Modal.Header>...</Modal.Header>
 *   <Modal.Body>...</Modal.Body>
 *   <Modal.Footer>...</Modal.Footer>
 */
'use client';

import { useEffect, useRef, useCallback, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

type ModalSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  size?: ModalSize;
  closeOnOverlay?: boolean;
  closeOnEsc?: boolean;
  showClose?: boolean;
  /** يطبق padding افتراضي داخل الحوار. اطفئيه لو عندك header/body/footer */
  padded?: boolean;
  /** CSS extra class للـcontainer */
  className?: string;
  children: ReactNode;
}

const sizeClasses: Record<ModalSize, string> = {
  xs: 'max-w-sm',
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-7xl',
};

export default function Modal({
  open,
  onClose,
  title,
  subtitle,
  size = 'md',
  closeOnOverlay = true,
  closeOnEsc = true,
  showClose = true,
  padded = true,
  className = '',
  children,
}: ModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // ESC للإغلاق
  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (closeOnEsc && e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    },
    [closeOnEsc, onClose],
  );

  // Body scroll lock + ESC listener
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', handleKey);
    };
  }, [open, handleKey]);

  // Focus first focusable element on open
  useEffect(() => {
    if (!open || !containerRef.current) return;
    const focusable = containerRef.current.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    focusable?.focus();
  }, [open]);

  if (!open) return null;
  if (typeof window === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9000] flex items-center justify-center p-3 md:p-6 animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-ink/60 backdrop-blur-sm"
        onClick={closeOnOverlay ? onClose : undefined}
        aria-hidden="true"
      />

      {/* Container */}
      <div
        ref={containerRef}
        className={`
          relative w-full ${sizeClasses[size]}
          bg-white rounded-2xl shadow-2xl
          max-h-[90vh] overflow-hidden flex flex-col
          animate-in zoom-in-95 duration-200
          ${className}
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {(title || showClose) && (
          <div className="flex items-start justify-between gap-3 p-4 md:p-5 border-b border-cream-100">
            <div className="flex-1 min-w-0">
              {title && (
                <h2 id="modal-title" className="font-ar-display text-lg md:text-xl font-bold text-ink truncate">
                  {title}
                </h2>
              )}
              {subtitle && <p className="text-xs md:text-sm text-ink-soft mt-0.5">{subtitle}</p>}
            </div>
            {showClose && (
              <button
                type="button"
                onClick={onClose}
                className="shrink-0 rounded-full p-1.5 text-ink-soft hover:text-ink hover:bg-cream-100 transition-colors"
                aria-label="إغلاق"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className={`flex-1 overflow-y-auto ${padded ? 'p-4 md:p-5' : ''}`}>{children}</div>
      </div>
    </div>,
    document.body,
  );
}

// ─── Sub-components for composition ──────────────────────────
Modal.Body = function ModalBody({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`p-4 md:p-5 ${className}`}>{children}</div>;
};

Modal.Footer = function ModalFooter({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`p-4 md:p-5 border-t border-cream-100 flex items-center justify-end gap-2 ${className}`}>
      {children}
    </div>
  );
};
