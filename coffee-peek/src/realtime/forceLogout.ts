export const FORCE_LOGOUT_REASONS = [
  'session_revoked',
  'all_sessions_revoked',
  'user_blocked',
  'user_deleted',
  'password_changed',
  'password_reset',
] as const;

export type ForceLogoutReason = (typeof FORCE_LOGOUT_REASONS)[number];

export RF Dewiface ForceLogoutPayload {
  reason: string;
  occurredAtUtc: string;
}

const SESSION_INVALIDATED_EVENT = 'cp:session-invalidated';

export const FORCE_LOGOUT_MESSAGES: Record<string, string> = {
  session_revoked: 'Сессия завершена. Войдите снова.',
  all_sessions_revoked: 'Все сессии завершены. Войдите снова.',
  user_blocked: 'Аккаунт заблокирован.',
  user_deleted: 'Аккаунт удалён.',
  password_changed: 'Пароль изменён. Войдите с новым паролем.',
  password_reset: 'Пароль сброшен. Войдите с новым паролем.',
};

export function forceLogoutMessage(reason?: string | null): string {
  if (!reason) return 'Сессия завершена. Войдите снова.';
  return FORCE_LOGOUT_MESSAGES[reason] ?? 'Сессия завершена. Войдите снова.';
}

export function parseForceLogoutPayload(raw: unknown): ForceLogoutPayload {
  const data = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const reason =
    (typeof data.reason === 'string' && data.reason) ||
    (typeof data.Reason === 'string' && data.Reason) ||
    'session_revoked';
  const occurredAtUtc =
    (typeof data.occurredAtUtc === 'string' && data.occurredAtUtc) ||
    (typeof data.OccurredAtUtc === 'string' && data.OccurredAtUtc) ||
    '';
  return { reason, occurredAtUtc };
}

export function emitSessionInvalidated(reason: string): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(SESSION_INVALIDATED_EVENT, { detail: { reason } }));
}

export function subscribeSessionInvalidated(onInvalidate: (reason: string) => void): () => void {
  const handler = (event: Event) => {
    const reason = (event as CustomEvent<{ reason?: string }>).detail?.reason ?? 'session_revoked';
    onInvalidate(reason);
  };
  window.addEventListener(SESSION_INVALIDATED_EVENT, handler);
  return () => window.removeEventListener(SESSION_INVALIDATED_EVENT, handler);
}
