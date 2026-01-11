const API_BASE_URL = import.meta.env.VITE_API_URL || "";

import { ApiResponse } from "./auth";

// Публичный профиль пользователя (минимальная информация)
export interface PublicUserProfile {
  id: string;
  userName: string;
  nickname?: string;
  avatarUrl?: string;
  about?: string;
  createdAt?: string;
  reviewCount?: number;
  checkInCount?: number;
}

/**
 * Получает публичную информацию о пользователе по ID
 */
export async function getUserPublicProfile(
  userId: string
): Promise<ApiResponse<PublicUserProfile | null>> {
  try {
    const token = localStorage.getItem('accessToken');
    const headers: HeadersInit = {
      Accept: "application/json",
    };
    
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    if (import.meta.env.DEV) {
      console.log(`[getUserPublicProfile] Fetching user profile for ID: ${userId}`);
    }

    const response = await fetch(`${API_BASE_URL}/api/User/${userId}`, {
      method: "GET",
      headers,
    });

    if (import.meta.env.DEV) {
      console.log(`[getUserPublicProfile] Response status: ${response.status}`);
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[getUserPublicProfile] Error response:`, errorText);
      
      // Return fallback profile for 500 errors (backend token issue)
      if (response.status === 500) {
        return {
          success: true,
          message: "Using fallback profile",
          data: {
            id: userId,
            userName: "Анонимный пользователь",
            nickname: undefined,
            avatarUrl: undefined,
            about: undefined,
            createdAt: undefined,
            reviewCount: 0,
            checkInCount: 0,
          },
        };
      }
      
      return {
        success: false,
        message: `Failed to fetch user profile: ${response.status} - ${errorText}`,
        data: null,
      };
    }

    const data = await response.json();
    if (import.meta.env.DEV) {
      console.log(`[getUserPublicProfile] Response data:`, data);
    }
    
    // Проверяем, был ли запрос успешным
    if (data.isSuccess === false || !data.data) {
      console.warn(`[getUserPublicProfile] API returned isSuccess=false or no data`);
      return {
        success: false,
        message: data.message || "User not found",
        data: null,
      };
    }
    
    // Нормализация данных в зависимости от структуры ответа
    const userData = data.data || data;
    
    if (!userData.id) {
      console.error(`[getUserPublicProfile] No user ID in response`);
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
        userName: userData.userName || userData.name || "Unknown User",
        nickname: userData.nickname,
        avatarUrl: userData.avatarUrl,
        about: userData.about,
        createdAt: userData.createdAt,
        reviewCount: userData.reviewCount,
        checkInCount: userData.checkInCount,
      },
    };
  } catch (error) {
    console.error("[getUserPublicProfile] Exception:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
      data: null,
    };
  }
}

/**
 * Получает публичные профили нескольких пользователей (batch)
 * Для оптимизации - запрашивает по одному, но можно добавить кэширование
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

