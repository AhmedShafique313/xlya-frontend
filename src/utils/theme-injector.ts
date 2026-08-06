import { cssVariables } from '@/constants/colors';

export const injectThemeColors = () => {
  if (typeof window !== 'undefined') {
    const root = document.documentElement;
    Object.entries(cssVariables).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
  }
};