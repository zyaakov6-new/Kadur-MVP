export const COLORS = {
  // Brand Colors - Apple-inspired calm palette
  turfGreen: '#0A7B5F',
  turfGreenLight: '#11A882',
  turfGreenDark: '#075E49',
  accentOrange: '#F5B041',
  accentOrangeLight: '#F8C471',
  accentGold: '#F9E79F',

  // Backgrounds - Bright, premium
  darkBackground: '#F4F6F8',
  darkBackgroundSecondary: '#EEF2F7',
  backgroundGradient: ['#F8FAFC', '#EEF2F7', '#F6F8FB'] as const,
  backgroundGradientLight: ['#FFFFFF', '#F7F9FC', '#EEF2F7'] as const,

  // Glass & Cards
  cardGlass: 'rgba(255, 255, 255, 0.7)',
  cardGlassStrong: 'rgba(255, 255, 255, 0.9)',
  cardGlassBorder: 'rgba(15, 23, 42, 0.08)',
  cardSolid: '#FFFFFF',
  cardSolidLight: '#F9FAFB',

  // Text Hierarchy
  textPrimary: '#0B0F12',
  textSecondary: '#5F6B7A',
  textTertiary: '#9AA4AF',
  textMuted: '#B6C0CA',

  // Status Colors
  success: '#22C55E',
  successLight: 'rgba(34, 197, 94, 0.12)',
  error: '#EF4444',
  errorLight: 'rgba(239, 68, 68, 0.12)',
  warning: '#F59E0B',
  warningLight: 'rgba(245, 158, 11, 0.12)',
  info: '#3B82F6',
  infoLight: 'rgba(59, 130, 246, 0.12)',

  // Interactive States
  inputBackground: '#F9FAFB',
  inputBorder: '#E5E7EB',
  inputFocusBorder: 'rgba(10, 123, 95, 0.45)',

  // Overlays
  overlayDark: 'rgba(15, 23, 42, 0.12)',
  overlayLight: 'rgba(255, 255, 255, 0.6)',
};

export const SPACING = {
  xxs: 2,
  xs: 4,
  s: 8,
  m: 16,
  l: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

export const BORDER_RADIUS = {
  xs: 4,
  s: 8,
  m: 12,
  l: 16,
  xl: 24,
  xxl: 32,
  full: 9999,
};

export const FONTS = {
  heading: 'System',
  body: 'System',
};

export const FONT_SIZES = {
  xs: 10,
  sm: 12,
  base: 14,
  md: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 28,
  '4xl': 32,
  '5xl': 40,
  '6xl': 48,
};

export const LINE_HEIGHTS = {
  tight: 1.1,
  normal: 1.4,
  relaxed: 1.6,
};

export const SHADOWS = {
  glass: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  button: {
    shadowColor: '#00875A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  glow: {
    shadowColor: '#00875A',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 12,
  },
  softGlow: {
    shadowColor: '#00875A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
};

export const ANIMATION = {
  fast: 150,
  normal: 250,
  slow: 400,
  spring: {
    damping: 15,
    stiffness: 150,
    mass: 1,
  },
};
