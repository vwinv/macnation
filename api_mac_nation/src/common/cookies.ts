import type { CookieOptions, Request, Response } from 'express';

export const CLIENT_COOKIE = 'mn_client';
export const ADMIN_COOKIE = 'mn_admin';

const MAX_AGE_MS = 1000 * 60 * 60 * 24 * 30;

export function cookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: MAX_AGE_MS,
  };
}

export function readCookie(req: Request, name: string) {
  const jar: Record<string, unknown> | undefined = (
    req as { cookies?: Record<string, unknown> }
  ).cookies;
  const value = jar ? jar[name] : undefined;
  return typeof value === 'string' ? value : '';
}

export function setClientCookie(res: Response, token: string) {
  res.cookie(CLIENT_COOKIE, token, cookieOptions());
}

export function clearClientCookie(res: Response) {
  res.cookie(CLIENT_COOKIE, '', { ...cookieOptions(), maxAge: 0 });
}

export function setAdminCookie(res: Response, token: string) {
  res.cookie(ADMIN_COOKIE, token, cookieOptions());
}

export function clearAdminCookie(res: Response) {
  res.cookie(ADMIN_COOKIE, '', { ...cookieOptions(), maxAge: 0 });
}
