import { httpClient } from './core/httpClient';
import { API_ENDPOINTS } from './core/apiConfig';

export function reportReview(reviewId: string, text: string) {
  const trimmed = text.trim();
  if (!trimmed || trimmed.length > 2000) throw new Error('Введите от 1 до 2000 символов');
  return httpClient.post<{ id: string }>(`${API_ENDPOINTS.REVIEW.BY_ID(reviewId)}/reports`, { text: trimmed }, { requiresAuth: true });
}
