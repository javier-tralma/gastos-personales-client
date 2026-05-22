import { writable } from 'svelte/store';

export type Toast = {
  id: number;
  message: string;
  tone: 'success' | 'error' | 'info';
};

export const toasts = writable<Toast[]>([]);

export function showToast(message: string, tone: Toast['tone'] = 'info') {
  const id = Date.now() + Math.random();
  toasts.update((items) => [...items, { id, message, tone }]);

  setTimeout(() => {
    toasts.update((items) => items.filter((item) => item.id !== id));
  }, 3200);
}
