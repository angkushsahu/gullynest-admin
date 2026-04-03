"use client";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

let _token: string | null = null;

/**
 * Called by AdminAppContext whenever the Supabase session changes.
 * Avoids calling getSession() inside apiFetch, which deadlocks when
 * invoked from within an onAuthStateChange callback.
 */
export function setApiToken(token: string | null): void {
  _token = token;
}

/**
 * Fetch wrapper for rental-app API calls. Uses the token set by
 * setApiToken() to send an Authorization Bearer header, enabling
 * cross-domain auth without relying on cookies.
 */
export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  return fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...options.headers,
      ...(_token ? { Authorization: `Bearer ${_token}` } : {}),
    },
  });
}
