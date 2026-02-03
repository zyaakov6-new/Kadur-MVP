export const COLORS = {
  // Brand Colors
  turfGreen: '#005A3C',
  turfGreenDark: '#003B26',
  accentOrange: '#FF5A1F',

  // Backgrounds
  darkBackground: '#050B08', // Slightly deeper green-black
  backgroundGradient: ['#050B08', '#00261A', '#004D33'], // Richer gradient
  cardGlass: 'rgba(255, 255, 255, 0.08)',
  cardGlassStrong: 'rgba(255, 255, 255, 0.15)',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.7)',
  textTertiary: 'rgba(255, 255, 255, 0.4)',

  // Status
  success: '#4ADE80',
  error: '#EF4444',
  warning: '#F59E0B',
};

export const SPACING = {
  xs: 4,
  s: 8,
  m: 16,
  l: 24,
  xl: 32,
  xxl: 48,
};

export const BORDER_RADIUS = {
  s: 8,
  m: 16,
  l: 24,
  xl: 32,
  full: 9999,
};

export const FONTS = {
  // In a real app, we would load custom fonts here.
  // For now, we use system fonts that mimic the requested style.
  heading: 'System',
  body: 'System',
};

export const SHADOWS = {
  glass: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  glow: {
    shadowColor: '#005A3C',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
};
