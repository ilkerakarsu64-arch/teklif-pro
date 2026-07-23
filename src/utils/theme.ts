export type ThemeMode = 'light' | 'dark' | 'midnight' | 'emerald' | 'sunset' | 'system';

export function applyThemeMode(theme: ThemeMode = 'light') {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  
  // Remove existing theme classes
  root.classList.remove('dark', 'theme-midnight', 'theme-emerald', 'theme-sunset');

  let activeTheme = theme;
  if (theme === 'system') {
    const isDarkSystem = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    activeTheme = isDarkSystem ? 'dark' : 'light';
  }

  switch (activeTheme) {
    case 'dark':
      root.classList.add('dark');
      break;
    case 'midnight':
      root.classList.add('dark', 'theme-midnight');
      break;
    case 'emerald':
      root.classList.add('dark', 'theme-emerald');
      break;
    case 'sunset':
      root.classList.add('dark', 'theme-sunset');
      break;
    case 'light':
    default:
      // Default light mode, no extra class needed
      break;
  }
}
