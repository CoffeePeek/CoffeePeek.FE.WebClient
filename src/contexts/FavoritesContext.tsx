import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { coffeeshopApi } from '../api';
import { useAuth } from './AuthContext';
import { toast } from 'sonner@2.0.3';
import { toErrorMessage } from '../shared/lib/errors';

type FavoritesContextType = {
  favoriteIds: string[];
  isFavorite: (shopId: string) => boolean;
  toggleFavorite: (shopId: string) => void;
  isPending: (shopId: string) => boolean;
};

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

const storageKey = (userId: string) => `favorites:${userId}`;

const readFromStorage = (key: string): string[] => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
    return [];
  } catch {
    return [];
  }
};

const writeToStorage = (key: string, ids: string[]) => {
  try {
    localStorage.setItem(key, JSON.stringify(ids));
  } catch {
    // ignore
  }
};

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? '';

  const key = userId ? storageKey(userId) : '';
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [pendingIds, setPendingIds] = useState<Record<string, boolean>>({});

  // Load when user changes
  useEffect(() => {
    if (!key) {
      setFavoriteIds([]);
      return;
    }
    setFavoriteIds(readFromStorage(key));
  }, [key]);

  // Persist when favorites change
  useEffect(() => {
    if (!key) return;
    writeToStorage(key, favoriteIds);
  }, [favoriteIds, key]);

  const isFavorite = useMemo(() => {
    const set = new Set(favoriteIds);
    return (shopId: string) => set.has(shopId);
  }, [favoriteIds]);

  const isPending = (shopId: string) => Boolean(pendingIds[shopId]);

  const addMutation = useMutation({
    mutationKey: ['favorite-add'],
    mutationFn: async (shopId: string) => {
      if (!userId) throw new Error('Не удалось определить пользователя');
      await coffeeshopApi.addToFavorite(shopId, userId);
    },
  });

  const removeMutation = useMutation({
    mutationKey: ['favorite-remove'],
    mutationFn: async (shopId: string) => {
      if (!userId) throw new Error('Не удалось определить пользователя');
      await coffeeshopApi.removeFromFavorite(shopId, userId);
    },
  });

  const toggleFavorite = (shopId: string) => {
    if (!shopId) return;
    if (!userId) {
      toast.error('Нужно войти в аккаунт');
      return;
    }

    // prevent double taps while request is in-flight
    if (pendingIds[shopId]) return;

    const wasFavorite = favoriteIds.includes(shopId);
    const prev = favoriteIds;

    setPendingIds((p) => ({ ...p, [shopId]: true }));
    setFavoriteIds((current) => {
      const set = new Set(current);
      if (wasFavorite) set.delete(shopId);
      else set.add(shopId);
      return Array.from(set);
    });

    const mutation = wasFavorite ? removeMutation : addMutation;
    mutation.mutate(shopId, {
      onSuccess: () => {
        toast.success(wasFavorite ? 'Удалено из избранного' : 'Добавлено в избранное');
      },
      onError: (e) => {
        setFavoriteIds(prev);
        toast.error('Не удалось обновить избранное', { description: toErrorMessage(e) });
      },
      onSettled: () => {
        setPendingIds((p) => {
          const next = { ...p };
          delete next[shopId];
          return next;
        });
      },
    });
  };

  return (
    <FavoritesContext.Provider value={{ favoriteIds, isFavorite, toggleFavorite, isPending }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites must be used within a FavoritesProvider');
  return ctx;
}




