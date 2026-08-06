export const colors = {
  // Extracted from gradient
  primary: '#ccac5d',      // 40% - Main gold
  secondary: '#ad8c44',    // 20% - Darker gold
  light: '#e3c97e',        // 60% - Light gold
  dark: '#8a6928',         // 0% - Darkest gold
  accent: '#f6e8a6',       // 75% - Lightest gold
  
  // Background colors
  background: '#0a0a0a',
  foreground: '#ededed',
  
  // Additional gradient colors (optional)
  lightest: '#fbfcf7',     // 85% - Almost white
  
  // Gray scale
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  }
};

// Export CSS variables format
export const cssVariables = {
  '--gold-primary': colors.primary,
  '--gold-secondary': colors.secondary,
  '--gold-light': colors.light,
  '--gold-dark': colors.dark,
  '--gold-accent': colors.accent,
  '--background': colors.background,
  '--foreground': colors.foreground,
};

// Export full gradient (optional - for special use cases)
export const gradients = {
  goldFull: `linear-gradient(
    135deg,
    ${colors.dark} 0%,
    ${colors.secondary} 20%,
    ${colors.primary} 40%,
    ${colors.light} 60%,
    ${colors.accent} 75%,
    ${colors.lightest} 85%,
    ${colors.secondary} 100%
  )`
};