/**
 * Shared light theme tokens for buyer and seller mobile screens.
 */
const theme = {
  colors: {
    background: '#F7F8FC',
    surface: '#FFFFFF',
    surfaceMuted: '#F1F4F9',
    primary: '#2E45D3',
    primarySoft: '#EAF0FF',
    textPrimary: '#101828',
    textSecondary: '#667085',
    textMuted: '#98A2B3',
    border: '#E4E8F0',
    success: '#16A34A',
    warning: '#D97706',
    danger: '#DC2626',
    tabInactive: '#A8B2C5',
    shadow: '#0F172A',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    pill: 999,
  },
  typography: {
    h1: {
      fontSize: 28,
      fontWeight: '700',
      color: '#101828',
    },
    h2: {
      fontSize: 22,
      fontWeight: '700',
      color: '#101828',
    },
    h3: {
      fontSize: 18,
      fontWeight: '700',
      color: '#101828',
    },
    body: {
      fontSize: 14,
      fontWeight: '500',
      color: '#667085',
    },
    label: {
      fontSize: 12,
      fontWeight: '600',
      color: '#667085',
    },
  },
  shadow: {
    card: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.08,
      shadowRadius: 14,
      elevation: 3,
    },
  },
};

export default theme;
