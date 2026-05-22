import { browser } from '$app/environment';
import { writable } from 'svelte/store';
import { api, type UserSettings } from '$lib/rpc/client';

export type Preferences = {
  currency: 'CLP' | 'USD';
  monthStart: '1' | '15' | '25';
  density: 'comfortable' | 'compact';
  theme: 'light' | 'dark' | 'system';
  notifications: boolean;
  sidebarCollapsed: boolean;
};

const STORAGE_KEY = 'gastos-personales:preferences';

export const defaultPreferences: Preferences = {
  currency: 'CLP',
  monthStart: '1',
  density: 'comfortable',
  theme: 'light',
  notifications: true,
  sidebarCollapsed: false
};

function readStoredPreferences() {
  if (!browser) return defaultPreferences;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...defaultPreferences, ...JSON.parse(raw) } : defaultPreferences;
  } catch {
    return defaultPreferences;
  }
}

function applyPreferences(value: Preferences) {
  if (!browser) return;
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const resolvedTheme = value.theme === 'system' ? (systemDark ? 'dark' : 'light') : value.theme;
  document.documentElement.dataset.density = value.density;
  document.documentElement.dataset.theme = resolvedTheme;
}

function normalizeRemoteSettings(value: UserSettings): Preferences {
  return {
    currency: value.currency,
    monthStart: String(value.monthStart) as Preferences['monthStart'],
    density: value.density,
    theme: value.theme,
    notifications: value.notifications,
    sidebarCollapsed: value.sidebarCollapsed
  };
}

function toRemoteSettings(value: Preferences) {
  return {
    currency: value.currency,
    monthStart: Number(value.monthStart),
    density: value.density,
    theme: value.theme,
    notifications: value.notifications,
    sidebarCollapsed: value.sidebarCollapsed
  };
}

function persistRemote(value: Preferences) {
  if (!browser) return;
  void api.settings.update(toRemoteSettings(value)).catch((error) => {
    console.error('No se pudieron guardar las preferencias de usuario', error);
  });
}

function createPreferencesStore() {
  const { subscribe, set, update } = writable<Preferences>(readStoredPreferences());

  if (browser) {
    let ready = false;
    let currentPreferences = readStoredPreferences();

    subscribe((value) => {
      currentPreferences = value;
      applyPreferences(value);
      if (ready) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
      }
    });

    window
      .matchMedia('(prefers-color-scheme: dark)')
      .addEventListener('change', () => {
        if (currentPreferences.theme === 'system') {
          applyPreferences(currentPreferences);
        }
      });

    ready = true;
  }

  return {
    subscribe,
    loadRemote: async () => {
      const remote = await api.settings.get();
      const next = normalizeRemoteSettings(remote);
      set(next);
      if (browser) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      }
    },
    setPreference: <Key extends keyof Preferences>(key: Key, value: Preferences[Key]) =>
      update((current) => {
        const next = { ...current, [key]: value };
        persistRemote(next);
        return next;
      }),
    toggleSidebar: () =>
      update((current) => {
        const next = { ...current, sidebarCollapsed: !current.sidebarCollapsed };
        persistRemote(next);
        return next;
      }),
    reset: () => {
      set(defaultPreferences);
      persistRemote(defaultPreferences);
    }
  };
}

export const preferences = createPreferencesStore();
