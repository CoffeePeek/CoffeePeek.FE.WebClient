/**
 * Парсит JWT токен и извлекает claims (payload)
 */
export interface JWTClaims {
  sub?: string; // User ID
  email?: string;
  name?: string;
  roles?: string[];
  exp?: number; // Expiration timestamp
  iat?: number; // Issued at timestamp
  [key: string]: unknown; // Другие claims
}

/**
 * Декодирует base64 строку (с поддержкой URL-safe кодирования)
 */
function base64UrlDecode(str: string): string {
  // Заменяем URL-safe символы обратно
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  
  // Добавляем padding если нужно
  const pad = base64.length % 4;
  if (pad) {
    base64 += '='.repeat(4 - pad);
  }
  
  try {
    return decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
  } catch (e) {
    throw new Error('Invalid base64 string');
  }
}

/**
 * Парсит JWT токен и возвращает payload (claims)
 */
export function parseJWT(token: string | null | undefined): JWTClaims | null {
  if (!token || typeof token !== 'string') {
    console.error('Token is missing or invalid');
    return null;
  }

  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.error('Invalid JWT token format');
      return null;
    }

    const payload = parts[1];
    const decoded = base64UrlDecode(payload);
    const claims = JSON.parse(decoded) as JWTClaims;
    
    return claims;
  } catch (error) {
    console.error('Error parsing JWT token:', error);
    return null;
  }
}

/**
 * Проверяет, истёк ли токен
 */
export function isTokenExpired(token: string | null | undefined): boolean {
  if (!token) {
    return true;
  }
  
  const claims = parseJWT(token);
  if (!claims || !claims.exp) {
    return true;
  }
  
  return claims.exp * 1000 < Date.now();
}

/**
 * Извлекает роль пользователя из токена
 */
export function getUserRoles(token: string | null | undefined): string[] {
  if (!token) {
    return [];
  }
  
  const claims = parseJWT(token);
  if (!claims) {
    return [];
  }
  
  // Роли могут быть в разных форматах
  if (Array.isArray(claims.roles)) {
    return claims.roles;
  }
  
  if (typeof claims.role === 'string') {
    return [claims.role];
  }
  
  // Проверяем claim с префиксом role или http://schemas.microsoft.com/ws/2008/06/identity/claims/role
  const roleClaim = claims['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
  if (Array.isArray(roleClaim)) {
    return roleClaim;
  }
  if (typeof roleClaim === 'string') {
    return [roleClaim];
  }
  
  return [];
}

/**
 * Извлекает email пользователя из токена
 */
export function getUserEmail(token: string | null | undefined): string | null {
  if (!token) {
    return null;
  }
  
  const claims = parseJWT(token);
  return claims?.email || claims?.sub || null;
}

/**
 * Извлекает ID пользователя из токена
 */
export function getUserId(token: string | null | undefined): string | null {
  if (!token) {
    return null;
  }
  
  const claims = parseJWT(token);
  return claims?.sub || null;
}

