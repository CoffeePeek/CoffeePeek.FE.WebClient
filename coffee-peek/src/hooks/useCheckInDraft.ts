import { useCallback, useEffect, useState } from 'react';
import {
  activateCheckInDraft,
  clearCheckInDraft,
  updateCheckInDraft,
  type CheckInDraftState,
} from '../utils/checkInDraft';

export function useCheckInDraft(shopId: string | null | undefined, isActive = true) {
  const normalizedShopId = shopId || null;
  const [draft, setDraft] = useState<CheckInDraftState | null>(() => (
    normalizedShopId && isActive ? activateCheckInDraft(normalizedShopId) : null
  ));

  useEffect(() => {
    if (!normalizedShopId || !isActive) return;
    setDraft(activateCheckInDraft(normalizedShopId));
  }, [normalizedShopId, isActive]);

  const updateDraft = useCallback((patch: Partial<Omit<CheckInDraftState, 'coffeeShopId'>>) => {
    if (!normalizedShopId || !isActive) return;
    setDraft(updateCheckInDraft(normalizedShopId, patch));
  }, [normalizedShopId, isActive]);

  const clearDraft = useCallback(() => {
    if (!normalizedShopId) return;
    clearCheckInDraft(normalizedShopId);
    setDraft(null);
  }, [normalizedShopId]);

  const currentDraft = isActive && draft?.coffeeShopId === normalizedShopId ? draft : null;

  return { draft: currentDraft, updateDraft, clearDraft };
}
