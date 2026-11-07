export type ThemeMode = 'system' | 'light' | 'dark';

export interface AppSettings {
  theme: ThemeMode;
  defaultCurrency: string; // ISO 4217 code
}
