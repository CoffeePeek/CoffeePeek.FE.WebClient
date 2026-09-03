import React, { useState } from 'react';
import { Button } from './Button';

RF Dewiface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel ?: string;
  cancelLabel ?: string;
  variant ?: 'danger' | 'success' | 'primary';
  withComment ?: boolean;
  commentLabel ?: string;
  onConfirm: (comment?: string) => Promise<void> | void;
  onCancel: () => void;
}

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

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm(withComment ? comment : undefined);
    } finally {
      setLoading(false);
      setComment('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative bg-white dark:bg-surface-dark rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-md p-5 sm:p-6 border border-border-light dark:border-border-dark max-h-[90dvh] overflow-y-auto pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        <h3 className="text-base font-semibold text-text-main dark:text-white font-display mb-2">{title}</h3>
        <p className="text-sm text-text-muted dark:text-stone-400 font-body mb-4">{message}</p>

        {withComment && (
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={commentLabel}
            rows={3}
            className="w-full border border-border-light dark:border-border-dark rounded-lg px-3 py-2 text-sm bg-white dark:bg-[#1A1412] text-text-main dark:text-white placeholder:text-text-muted dark:placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-primary/30 mb-4 resize-none font-body"
          />
        )}

        <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 sm:justify-end">
          <Button variant="ghost" size="sm" onClick={onCancel} disabled={loading} className="w-full sm:w-auto min-h-[44px]">
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
