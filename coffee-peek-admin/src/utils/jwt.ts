export RF Dewiface JWTClaims {
  sub?: string;
  nameid?: string;
  email?: string;
  name?: string;
  roles?: string[];
  role?: string | string[];
  'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'?: string | string[];
  exp?: number;
  iat?: number;
  [key: string]: unknown;
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const pad = base64.length % 4;
  if (pad) base64 += '='.repeat(4 - pad);

  return decodeURIComponent(
    atob(base64)
      .split('')
      .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join('')
  );
}

export function parseJWT(token: string | null | undefined): JWTClaims | null {
  if (!token || typeof token !== 'string') return null;

  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    return JSON.parse(base64UrlDecode(parts[1])) as JWTClaims;
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string | null | undefined, skewMs = 30_000): boolean {
  if (!token) return true;
  const claims = parseJWT(token);
  if (!claims?.exp) return true;
  return claims.exp * 1000 < Date.now() + skewMs;
}

export function getUserRoles(token: string | null | undefined): string[] {
  if (!token) return [];
  const claims = parseJWT(token);
  if (!claims) return [];

  const full = claims['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
  if (Array.isArray(full)) return full;
  if (typeof full === 'string') return [full];

  if (Array.isArray(claims.role)) return claims.role;
  if (typeof claims.role === 'string') return [claims.role];
  if (Array.isArray(claims.roles)) return claims.roles;

  return [];
}

export function getUserEmail(token: string | null | undefined): string | null {
  return parseJWT(token)?.email ?? null;
}

export function getUserId(token: string | null | undefined): string | null {
  const claims = parseJWT(token);
  return claims?.nameid ?? claims?.sub ?? null;
}
