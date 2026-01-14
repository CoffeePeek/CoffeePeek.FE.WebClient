import { useUser } from '../contexts/UserContext';
import { useToast } from '../contexts/ToastContext';
import { useIsFavorite, useToggleFavorite } from './queries/useFavorites';

/**
 * Hook to manage favorite status for a coffee shop
 * @deprecated Use useIsFavorite and useToggleFavorite directly from queries
 */
export function useFavoriteStatus(shopId: string | null) {
  const { user } = useUser();
  const { showToast } = useToast();
  const token = user ? localStorage.getItem('accessToken') : null;
  
  const { isFavorite, isLoading: isChecking } = useIsFavorite(shopId, token, !!user && !!shopId);
  const { toggle, isLoading: isToggling } = useToggleFavorite();

  const toggleFavorite = async () => {
    if (!user) {
      showToast('Необходимо войти в систему', 'error');
      return;
    }

    if (!shopId || !token) return;

    try {
      const currentIsFavorite = isFavorite;
      await toggle({ shopId, isFavorite: currentIsFavorite, token });
      showToast(
        currentIsFavorite ? 'Удалено из избранного' : 'Добавлено в избранное',
        'success'
      );
    } catch (err: any) {
      console.error('Error toggling favorite:', err);
      showToast('Не удалось изменить статус избранного', 'error');
    }
  };

  return {
    isFavorite,
    isChecking: isChecking || isToggling,
    toggleFavorite,
  };
}

