import { httpClient } from './core/httpClient';
import { API_ENDPOINTS } from './core/apiConfig';
import { ApiResponse } from './core/types';

export interface PublicUserProfile {
  id: string;
  userName: string;
  nickname?: string;
  avatarUrl?: string;
  about?: string;
  createdAtUtc?: string;
  reviewCount?: number;
  checkInCount?: number;
}

export function getUserPublicProfile(
  userId: string
): Promise<ApiResponse<PublicUserProfile>> {
  return httpClient.get<PublicUserProfile>(API_ENDPOINTS.USER.BY_ID(userId));
}
