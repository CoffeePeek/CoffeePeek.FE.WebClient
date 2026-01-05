/**
 * Парсит JWT токен и извлекает claims (payload)
 */
export interface JWTClaims {
  sub?: string; // Subject
  nameid?: string; // User ID (JwtRegisteredClaimNames.NameId)
  email?: string; // Email (JwtRegisteredClaimNames.Email)
  name?: string;
  roles?: string[];
  role?: string | string[]; // Role claim (может быть строкой или массивом)
  'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'?: string | string[]; // ClaimTypes.Role
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
 * Роли добавляются через ClaimTypes.Role, что в JWT может быть:
 * - "http://schemas.microsoft.com/ws/2008/06/identity/claims/role" (полный путь)
 * - "role" (короткое имя)
 */
export function getUserRoles(token: string | null | undefined): string[] {
  if (!token) {
    return [];
  }
  
  const claims = parseJWT(token);
  if (!claims) {
    return [];
  }
  
  // Проверяем стандартный claim для ролей (ClaimTypes.Role)
  const roleClaimFull = claims['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
  if (Array.isArray(roleClaimFull)) {
    return roleClaimFull;
  }
  if (typeof roleClaimFull === 'string') {
    return [roleClaimFull];
  }
  
  // Проверяем короткое имя "role"
  if (Array.isArray(claims.role)) {
    return claims.role;
  }
  if (typeof claims.role === 'string') {
    return [claims.role];
  }
  
  // Проверяем массив "roles" (на случай другого формата)
  if (Array.isArray(claims.roles)) {
    return claims.roles;
  }
  
  return [];
}

/**
 * Извлекает email пользователя из токена
 * Email добавляется через JwtRegisteredClaimNames.Email
 */
export function getUserEmail(token: string | null | undefined): string | null {
  if (!token) {
    return null;
  }
  
  const claims = parseJWT(token);
  // Email хранится в claim "email" (JwtRegisteredClaimNames.Email)
  return claims?.email || null;
}

/**
 * Извлекает ID пользователя из токена
 * ID добавляется через JwtRegisteredClaimNames.NameId
 */
export function getUserId(token: string | null | undefined): string | null {
  if (!token) {
    return null;
  }
  
  const claims = parseJWT(token);
  // ID хранится в claim "nameid" (JwtRegisteredClaimNames.NameId)
  return claims?.nameid || claims?.sub || null;
}

