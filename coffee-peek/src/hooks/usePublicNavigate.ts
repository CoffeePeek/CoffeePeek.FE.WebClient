import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../contexts/ToastContext';
import { getBySlug } from '../api/publicAddresses';
import { usePublicResolution } from '../components/PublicAddressPage';
import type { AddressKind, PublicAddress } from '../api/publicAddresses';
export function usePublicNavigate() {
  const navigate = useNavigate();
  const resolution = usePublicResolution();
  const blockedUntil = useRef(new Map<string, number>());
  const { showToast } = useToast();
  return async (kind: AddressKind, target: string | PublicAddress | null | undefined, suffix = '', options?: { state?: unknown }) => {
    if (!target) return;
    const id = typeof target === 'string' ? target : target.slug;
    if (!id) return;
    const key = `${kind}:${id}`;
    if (Date.now() < (blockedUntil.current.get(key) || 0)) { showToast('Повторите позже.', 'info'); return; }
    try {
      const address = typeof target !== 'string' ? target
        : resolution?.id === id ? resolution.data?.publicAddress
        : (await getBySlug(kind, id)).address;
      if (!address) throw new Error('Address unavailable');
      navigate(address.canonicalPath + suffix, options);
    }
    catch (cause) {
      const error = cause as { status?: number; retryAfter?: string };
      const retryAfter = error.retryAfter;
      const until = retryAfter ? (/^\d+$/.test(retryAfter) ? Date.now() + Number(retryAfter) * 1000 : Date.parse(retryAfter)) : 0;
      blockedUntil.current.set(key, Math.max(Date.now() + 1000, Number.isFinite(until) ? until : 0));
      showToast(error.status === 404 ? 'Страница не найдена.' : 'Адрес временно недоступен. Попробуйте ещё раз.', 'error');
    }
  };
}
