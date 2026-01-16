/**
 * API модуль для работы с публичными профилями пользователей
 */

import { httpClient } from './core/httpClient';
import { API_ENDPOINTS } from './core/apiConfig';
import { ApiResponse } from './core/types';

// ==================== Types ====================

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

// ==================== API Functions ====================

/**
 * Получает публичный профиль пользователя по ID
 */
export async function getUserPublicProfile(
  userId: string
): Promise<ApiResponse<PublicUserProfile | null>> {
  try {
    if (import.meta.env.DEV) {
      console.log(`[getUserPublicProfile] Fetching user profile for ID: ${userId}`);
    }

    const response = await httpClient.get<PublicUserProfile>(
      API_ENDPOINTS.USER.BY_ID(userId),
      { requiresAuth: false }
    );

    if (import.meta.env.DEV) {
      console.log(`[getUserPublicProfile] Response:`, response);
    }

    // Нормализация данных в зависимости от структуры ответа
    const userData = response.data;
    
    if (!userData || !userData.id) {
      console.warn(`[getUserPublicProfile] No user ID in response`);
      return {
        success: false,
        message: "Invalid user data: missing ID",
        data: null,
      };
    }
    
    return {
      success: true,
      message: "User profile loaded successfully",
      data: {
        id: userData.id,
        userName: userData.userName || "Unknown User",
        nickname: userData.nickname,
        avatarUrl: userData.avatarUrl,
        about: userData.about,
        createdAtUtc: userData.createdAtUtc,
        reviewCount: userData.reviewCount,
        checkInCount: userData.checkInCount,
      },
    };
  } catch (error: any) {
    console.error("[getUserPublicProfile] Exception:", error);
    
    // Возвращаем fallback профиль для 500 ошибок
    if (error.status === 500) {
      return {
        success: true,
        message: "Using fallback profile",
        data: {
          id: userId,
          userName: "Анонимный пользователь",
          nickname: undefined,
          avatarUrl: undefined,
          about: undefined,
          createdAtUtc: undefined,
          reviewCount: 0,
          checkInCount: 0,
        },
      };
    }
    
    return {
      success: false,
      message: error.message || "Unknown error",
      data: null,
    };
  }
}

/**
 * Получает публичные профили нескольких пользователей (batch)
 * Для оптимизации - запрашивает параллельно
 */
export async function getUsersPublicProfiles(
  userIds: string[]
): Promise<Map<string, PublicUserProfile>> {
  const userMap = new Map<string, PublicUserProfile>();
  
  // Убираем дубликаты
  const uniqueIds = [...new Set(userIds)];
  
  // Запрашиваем всех пользователей параллельно
  const promises = uniqueIds.map(id => getUserPublicProfile(id));
  const results = await Promise.all(promises);
  
  results.forEach((result, index) => {
    if (result.success && result.data) {
      userMap.set(uniqueIds[index], result.data);
    }
  });
  
  return userMap;
}
