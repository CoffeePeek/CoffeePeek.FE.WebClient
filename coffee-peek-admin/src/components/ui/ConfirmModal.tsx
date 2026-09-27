import React, { useEffect, useId, useRef, useState } from 'react';
import { Button } from './Button';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'success' | 'primary';
  withComment?: boolean;
  commentLabel?: string;
  onConfirm: (comment?: string) => Promise<void> | void;
  onCancel: () => void;
}

const FOCUSABLE = 'button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])';

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Подтвердить',
  cancelLabel = 'Отмена',
  variant = 'primary',
  withComment = false,
  commentLabel = 'Комментарий',
  onConfirm,
  onCancel,
}) => {
  const [loading, setLoading] = useState(false);
  const [comment, setComment] = useState('');
  const titleId = useId();
  const commentId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);
  const onCancelRef = useRef(onCancel);
  onCancelRef.current = onCancel;

  useEffect(() => {
    if (!isOpen) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const dialog = dialogRef.current;
    const initial = dialog?.querySelector<HTMLElement>(withComment ? 'textarea' : '[data-autofocus]');
    initial?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (!loadingRef.current) {
          e.preventDefault();
          onCancelRef.current();
        }
        return;
      }
      if (e.key === 'Tab' && dialog) {
        const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE));
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        const active = document.activeElement;
        if (e.shiftKey && (active === first || !dialog.contains(active))) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && (active === last || !dialog.contains(active))) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previouslyFocused?.focus?.();
    };
  }, [isOpen, withComment]);

  if (!isOpen) return null;

  const handleCancel = () => {
    if (loadingRef.current) return;
    onCancel();
  };

  const handleConfirm = async () => {
    setLoading(true);
    loadingRef.current = true;
    try {
      await onConfirm(withComment ? comment : undefined);
      setComment('');
    } catch (err) {
      // Caller is responsible for user-facing error toasts; keep the typed comment.
      console.error(err);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/50" onClick={handleCancel} />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative bg-white dark:bg-surface-dark rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-md p-5 sm:p-6 border border-border-light dark:border-border-dark max-h-[90dvh] overflow-y-auto pb-[max(1.25rem,env(safe-area-inset-bottom))]"
      >
        <h3 id={titleId} className="text-base font-semibold text-text-main dark:text-white font-display mb-2">{title}</h3>
        <p className="text-sm text-text-muted dark:text-stone-400 font-body mb-4">{message}</p>

        {withComment && (
          <>
            <label htmlFor={commentId} className="sr-only">{commentLabel}</label>
            <textarea
              id={commentId}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={commentLabel}
              rows={3}
              className="w-full border border-border-light dark:border-border-dark rounded-lg px-3 py-2 text-sm bg-white dark:bg-[#1A1412] text-text-main dark:text-white placeholder:text-text-muted dark:placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-primary/30 mb-4 resize-none font-body"
            />
          </>
        )}

        <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 sm:justify-end">
          <Button variant="ghost" size="sm" onClick={handleCancel} disabled={loading} data-autofocus className="w-full sm:w-auto min-h-[44px]">
            {cancelLabel}
          </Button>
          <Button variant={variant} size="sm" onClick={handleConfirm} loading={loading} className="w-full sm:w-auto min-h-[44px]">
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
};
