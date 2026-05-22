import { createAuthClient } from 'better-auth/svelte';

export function resolveApiBaseUrl() {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }

  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.hostname}:3000`;
  }

  return 'http://localhost:3000';
}

export const authClient = createAuthClient({
  baseURL: resolveApiBaseUrl(),
  basePath: '/api/auth',
  fetchOptions: {
    credentials: 'include',
  },
});
