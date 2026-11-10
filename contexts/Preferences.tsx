import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export const PREFERENCES_KEY = 'force-exam-preferences-v1';
export type Preferences = { theme: 'graphite' | 'midnight' | 'warm' | 'forest' | 'rose' | 'oled' | 'catppuccin' | 'one-dark' | 'daylight' | 'paper' | 'latte'; accent: 'violet' | 'teal' | 'blue' | 'custom'; customAccent: string; textSize: 'standard' | 'large'; reducedMotion: boolean };
const defaults: Preferences = { theme: 'graphite', accent: 'violet', customAccent: '#b69af6', textSize: 'standard', reducedMotion: false };
function readPreferences(): Preferences {
  try {
    const value = JSON.parse(localStorage.getItem(PREFERENCES_KEY) ?? '{}');
    // Update the previous OLED preset while preserving other custom accents.
    if (value?.theme === 'oled' && value.accent === 'custom' && value.customAccent?.toLowerCase() === '#a8c7fa') value.customAccent = '#ffffff';
    return {
      theme: ['graphite', 'midnight', 'warm', 'forest', 'rose', 'oled', 'catppuccin', 'one-dark', 'daylight', 'paper', 'latte'].includes(value.theme) ? value.theme : defaults.theme,
      accent: ['violet', 'teal', 'blue', 'custom'].includes(value.accent) ? value.accent : defaults.accent,
      customAccent: typeof value.customAccent === 'string' && /^#[0-9a-f]{6}$/i.test(value.customAccent) ? value.customAccent : defaults.customAccent,
      textSize: value.textSize === 'large' ? 'large' : 'standard',
      reducedMotion: value.reducedMotion === true,
    };
  } catch { return defaults; }
}
export const isLightTheme = (theme: Preferences['theme']) => ['daylight', 'paper', 'latte'].includes(theme);
export function mixColor(color: string, target: string, amount: number) {
  return '#' + [1, 3, 5].map(offset => Math.round(parseInt(color.slice(offset, offset + 2), 16) * (1 - amount) + parseInt(target.slice(offset, offset + 2), 16) * amount).toString(16).padStart(2, '0')).join('');
}
export function accentPalette(preferences: Preferences) {
  const color = preferences.accent === 'custom' ? preferences.customAccent : { violet: '#b69af6', teal: '#7ddbc4', blue: '#90c5ff' }[preferences.accent];
  return Object.fromEntries([50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map((shade, index) => [shade, index <= 5 ? mixColor(color, '#ffffff', (5 - index) * .13) : mixColor(color, '#000000', (index - 5) * .17)]));
}
const PreferencesContext = createContext({ preferences: defaults, update: (_value: Partial<Preferences>) => {}, reset: () => {}, refresh: () => {}, error: '' });
export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState(defaults);
  const [error, setError] = useState('');
  const refresh = () => setPreferences(readPreferences());
  useEffect(() => { refresh(); }, []);
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.workspaceTheme = preferences.theme;
    const light = isLightTheme(preferences.theme);
    root.dataset.appearance = light ? 'light' : 'dark';
    root.dataset.accent = preferences.accent;
    const color = accentPalette(preferences)[500];
    const luminance = [1, 3, 5].map(offset => {
      const channel = parseInt(color.slice(offset, offset + 2), 16) / 255;
      return channel <= .04045 ? channel / 12.92 : Math.pow((channel + .055) / 1.055, 2.4);
    }).reduce((sum, value, index) => sum + value * [.2126, .7152, .0722][index], 0);
    root.style.setProperty('--accent', color);
    root.style.setProperty('--accent-hover', mixColor(color, light ? '#000000' : '#ffffff', .18));
    root.style.setProperty('--accent-text', light ? mixColor(color, '#000000', .4) : mixColor(color, '#ffffff', .2));
    root.style.setProperty('--accent-soft', mixColor(color, light ? '#ffffff' : preferences.theme === 'oled' ? '#000000' : '#191919', .82));
    root.style.setProperty('--accent-ink', luminance > .179 ? '#000000' : '#ffffff');
    root.dataset.reducedMotion = String(preferences.reducedMotion);
    root.style.fontSize = preferences.textSize === 'large' ? '18px' : '16px';
  }, [preferences]);
  const save = (value: Preferences) => {
    try { localStorage.setItem(PREFERENCES_KEY, JSON.stringify(value)); setPreferences(value); setError(''); }
    catch { setError('Your appearance changes could not be saved. Free some device storage and try again.'); }
  };
  return <PreferencesContext.Provider value={{ preferences, update: value => save({ ...preferences, ...value }), reset: () => save(defaults), refresh, error }}>{children}</PreferencesContext.Provider>;
}
export const usePreferences = () => useContext(PreferencesContext);
