export type ThemeMode = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'roomflow-theme-mode';

export const THEME_LABELS: Record<ThemeMode, string> = {
  light: '浅色',
  dark: '深色',
};

export const THEME_TOKENS: Record<
  ThemeMode,
  {
    background: string;
    surface: string;
    text: string;
    muted: string;
    border: string;
    chartGrid: string;
  }
> = {
  light: {
    background: '#f5f7f1',
    surface: '#ffffff',
    text: '#17211b',
    muted: '#66736d',
    border: '#dde5dc',
    chartGrid: '#e4ebe3',
  },
  dark: {
    background: '#101612',
    surface: '#18201b',
    text: '#eef4ed',
    muted: '#9ca89f',
    border: '#2c382f',
    chartGrid: '#29352d',
  },
};
