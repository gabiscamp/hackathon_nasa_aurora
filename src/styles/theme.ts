/** Space Station Game - Theme Constants */

export const colors = {
  bgPrimary: '#0a0e1a',
  bgSecondary: '#141b2d',
  bgPanel: '#1a2340',
  textPrimary: '#e2e8f0',
  textSecondary: '#94a3b8',
  accentBlue: '#3b82f6',
  accentAmber: '#f59e0b',
  accentRed: '#ef4444',
  accentGreen: '#10b981',
  accentPurple: '#8b5cf6',
  border: '#1e3a5f',
} as const;

export const resourceColors = {
  energy: '#f59e0b',
  oxygen: '#3b82f6',
  shielding: '#8b5cf6',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
} as const;

export const spacingScale = [4, 8, 12, 16, 24, 32, 48] as const;

export const typography = {
  fontFamily: "'Nunito', system-ui, -apple-system, sans-serif",
  sizes: {
    sm: 14,
    base: 18,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
} as const;

export const breakpoints = {
  mobile: 640,
  tablet: 768,
  desktop: 1024,
} as const;

export const theme = {
  colors,
  resourceColors,
  spacing,
  spacingScale,
  typography,
  breakpoints,
} as const;

export default theme;
