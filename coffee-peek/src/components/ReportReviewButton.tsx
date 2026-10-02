import { useId, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { reportReview } from '../api/reviewReports';
import { useUser } from '../contexts/UserContext';
import { useToast } from '../contexts/ToastContext';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeClasses } from '../utils/theme';
import { getErrorMessage } from '../utils/errorHandler';

export default function ReportReviewButton({ reviewId }: { reviewId: string }) {
  const { user } = useUser();
  const { theme } = useTheme();
  const classes = getThemeClasses(theme);
  const { showToast } = useToast();
  const id = useId();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [sent, setSent] = useState(false);
  const mutation = useMutation({
    mutationFn: () => reportReview(reviewId, text),
    onSuccess: () => { setSent(true); setOpen(false); setText(''); showToast('Жалоба отправлена', 'success'); },
  });
  if (!user) return null;
  return (
    <div className={`mt-3 text-sm ${classes.text.primary}`}>
      {sent ? <p role="status">Жалоба отправлена</p> : <button type="button" className={`${classes.text.secondary} underline min-h-[44px]`} aria-expanded={open} aria-controls={id} disabled={mutation.isPending} onClick={() => { setOpen(!open); mutation.reset(); }}>Пожаловаться</button>}
      {open && <form id={id} className="space-y-2" onSubmit={event => { event.preventDefault(); if (!mutation.isPending) mutation.mutate(); }}>
        <label htmlFor={`${id}-text`} className="block">Причина жалобы (1–2000 символов)</label>
        <textarea id={`${id}-text`} required maxLength={2000} rows={3} value={text} onChange={event => setText(event.target.value)} disabled={mutation.isPending} className={`w-full rounded-xl border p-3 ${classes.bg.primary} ${classes.border.default}`} />
        {mutation.error && <p role="alert" className="text-red-500">{(mutation.error as { status?: number }).status === 429 ? 'Слишком много запросов. Попробуйте позже.' : (mutation.error as { status?: number }).status === 404 ? 'Отзыв больше недоступен.' : getErrorMessage(mutation.error)}</p>}
        <button type="submit" disabled={mutation.isPending || !text.trim()} className={`rounded-xl px-4 py-3 font-bold disabled:opacity-50 ${classes.primary.bg} ${classes.text.inverse}`}>{mutation.isPending ? 'Отправка…' : 'Отправить жалобу'}</button>
      </form>}
    </div>
  );
}
