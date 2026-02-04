export const COLORS = {
  // Brand Colors - Vibrant neon palette
  turfGreen: '#00D26A',
  turfGreenLight: '#00E676',
  turfGreenDark: '#00A855',
  accentOrange: '#FF6B35',
  accentOrangeLight: '#FF8A5C',
  accentGold: '#FFD700',
  accentPurple: '#A855F7',
  accentBlue: '#38BDF8',
  accentYellow: '#FBBF24',

  // Backgrounds - Dark premium gradient
  darkBackground: '#0A1A14',
  darkBackgroundSecondary: '#0D2818',
  darkBackgroundTertiary: '#14332A',
  backgroundGradient: ['#0A1A14', '#0D2818', '#14332A'] as const,
  backgroundGradientLight: ['#0D2818', '#14332A', '#1A4033'] as const,

  // Glass & Cards - Dark glassmorphism
  cardGlass: 'rgba(255, 255, 255, 0.08)',
  cardGlassStrong: 'rgba(255, 255, 255, 0.12)',
  cardGlassBorder: 'rgba(255, 255, 255, 0.12)',
  cardSolid: 'rgba(255, 255, 255, 0.06)',
  cardSolidLight: 'rgba(255, 255, 255, 0.04)',

  // Text Hierarchy - Light on dark
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.7)',
  textTertiary: 'rgba(255, 255, 255, 0.5)',
  textMuted: 'rgba(255, 255, 255, 0.35)',

  // Status Colors
  success: '#00D26A',
  successLight: 'rgba(0, 210, 106, 0.15)',
  error: '#FF5252',
  errorLight: 'rgba(255, 82, 82, 0.15)',
  warning: '#FF9800',
  warningLight: 'rgba(255, 152, 0, 0.15)',
  info: '#38BDF8',
  infoLight: 'rgba(56, 189, 248, 0.15)',

  // Interactive States
  inputBackground: 'rgba(255, 255, 255, 0.06)',
  inputBorder: 'rgba(255, 255, 255, 0.12)',
  inputFocusBorder: 'rgba(0, 210, 106, 0.5)',

  // Overlays
  overlayDark: 'rgba(0, 0, 0, 0.6)',
  overlayLight: 'rgba(255, 255, 255, 0.1)',
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
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 12,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  button: {
    shadowColor: '#00D26A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  glow: {
    shadowColor: '#00D26A',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 12,
  },
  softGlow: {
    shadowColor: '#00D26A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
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
