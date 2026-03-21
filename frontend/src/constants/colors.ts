// Solaris Brand Colors - Premium Wellness Design System
export const Colors = {
  // Primary
  deepNavy: '#0A1628',
  midnightBlue: '#0F2340',
  darkBlue: '#1A3A5C',
  
  // Accent - Vitality Greens
  emerald: '#10B981',
  emeraldLight: '#34D399',
  emeraldDark: '#059669',
  
  // Support - Teal
  teal: '#14B8A6',
  tealLight: '#5EEAD4',
  tealDark: '#0D9488',
  
  // Premium - Gold
  gold: '#F59E0B',
  goldLight: '#FCD34D',
  goldDark: '#D97706',
  
  // Neutrals
  cream: '#FEF9F3',
  warmWhite: '#FAF7F2',
  lightGray: '#E5E7EB',
  mediumGray: '#9CA3AF',
  darkGray: '#4B5563',
  
  // Functional
  white: '#FFFFFF',
  black: '#000000',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  
  // Gradients (as arrays for LinearGradient)
  gradientPrimary: ['#0A1628', '#0F2340', '#1A3A5C'],
  gradientEmerald: ['#059669', '#10B981', '#34D399'],
  gradientGold: ['#D97706', '#F59E0B', '#FCD34D'],
  gradientTeal: ['#0D9488', '#14B8A6', '#5EEAD4'],
  
  // Transparent overlays
  overlay: 'rgba(10, 22, 40, 0.8)',
  overlayLight: 'rgba(10, 22, 40, 0.5)',
  glowEmerald: 'rgba(16, 185, 129, 0.3)',
  glowGold: 'rgba(245, 158, 11, 0.3)',
};

export const Shadows = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  glow: {
    shadowColor: Colors.emerald,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};
