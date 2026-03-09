import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeState {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  getEffectiveTheme: () => 'light' | 'dark';
}

function applyTheme(mode: ThemeMode) {
  const effective =
    mode === 'system'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      : mode;
  document.documentElement.setAttribute('data-theme', effective);
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      mode: 'light',

      setMode: (mode) => {
        set({ mode });
        applyTheme(mode);
      },

      getEffectiveTheme: () => {
        const { mode } = get();
        if (mode === 'system') {
          return window.matchMedia('(prefers-color-scheme: dark)').matches
            ? 'dark'
            : 'light';
        }
        return mode;
      },
    }),
    { name: 'theme-storage' },
  ),
);

// Initialize theme on load
const stored = JSON.parse(localStorage.getItem('theme-storage') || '{}');
const initialMode: ThemeMode = stored?.state?.mode || 'light';
applyTheme(initialMode);

// Listen for OS preference changes when mode is 'system'
window
  .matchMedia('(prefers-color-scheme: dark)')
  .addEventListener('change', () => {
    const { mode } = useThemeStore.getState();
    if (mode === 'system') {
      applyTheme('system');
    }
  });
