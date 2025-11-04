/**
 * Ninety Design System - Theme Configuration
 * Based on CalAI visual design language
 * Version: 1.0
 * Last Updated: 2025-11-04
 */

// ============================================================================
// COLORS
// ============================================================================

export const colors = {
  // Primary colors
  primary: '#000000',      // Black - primary actions, text
  secondary: '#FF6B00',    // Orange - accents, CTAs
  background: '#FFFFFF',   // White - main background

  // Neutrals (Grays)
  neutral: {
    50: '#F8F9FA',         // Lightest - card backgrounds
    100: '#F5F5F7',        // Input backgrounds
    200: '#E5E7EB',        // Borders, dividers
    300: '#D1D5DB',        // Disabled states
    400: '#9CA3AF',        // Placeholder text
    500: '#6B7280',        // Secondary text
    600: '#4B5563',        // Tertiary text
    900: '#000000',        // Primary text (same as primary)
  },

  // Accent colors
  accent: {
    orange: '#FF6B00',           // Main accent
    orangeLight: '#FFE8D6',      // Light orange backgrounds
    orangeDark: '#E55D00',       // Pressed/hover states
  },

  // Status colors
  status: {
    success: '#10B981',    // Green - success messages
    warning: '#F59E0B',    // Amber - warnings
    error: '#EF4444',      // Red - errors
    info: '#3B82F6',       // Blue - informational
  },

  // Macro colors (Nutrition)
  macro: {
    protein: '#FF6B88',    // Pink/Red for protein
    carbs: '#FFA756',      // Orange for carbs
    fats: '#6B9DFF',       // Blue for fats
  },

  // Legacy aliases (for backward compatibility, gradually remove)
  text: '#000000',                  // Use colors.primary instead
  textSecondary: '#6B7280',         // Use colors.neutral[500] instead
  surface: '#F8F9FA',               // Use colors.neutral[50] instead
  border: '#E5E7EB',                // Use colors.neutral[200] instead
  cardBackground: '#FFFFFF',        // Use colors.background instead
  inputBackground: '#F5F5F7',       // Use colors.neutral[100] instead
  divider: '#E5E7EB',               // Use colors.neutral[200] instead
  success: '#10B981',               // Use colors.status.success instead
  warning: '#F59E0B',               // Use colors.status.warning instead
  error: '#EF4444',                 // Use colors.status.error instead
  streak: '#FF6B00',                // Use colors.secondary instead
};

// ============================================================================
// SPACING
// ============================================================================

export const spacing = {
  0: 0,
  1: 4,      // xs - tight spacing
  2: 8,      // sm - small gaps
  3: 12,     // md-small - component gaps
  4: 16,     // md - standard spacing
  5: 20,     // md-lg - card padding
  6: 24,     // lg - section spacing
  8: 32,     // xl - large spacing
  10: 40,    // 2xl - extra large
  12: 48,    // 3xl - very large
  16: 64,    // 4xl - massive spacing

  // Legacy aliases (gradually migrate to numeric keys)
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// ============================================================================
// TYPOGRAPHY
// ============================================================================

export const typography = {
  // Display (very large numbers, focal points)
  display: {
    fontSize: 72,
    fontWeight: '700' as const,
    lineHeight: 72 * 1.0, // 72
  },

  // Headers
  h1: {
    fontSize: 32,
    fontWeight: '700' as const,
    lineHeight: 32 * 1.2, // 38.4
  },
  h2: {
    fontSize: 28,
    fontWeight: '700' as const,
    lineHeight: 28 * 1.2, // 33.6
  },
  h3: {
    fontSize: 24,
    fontWeight: '600' as const,
    lineHeight: 24 * 1.2, // 28.8
  },
  h4: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 20 * 1.2, // 24
  },

  // Body text
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 16 * 1.5, // 24
  },
  bodyMedium: {
    fontSize: 16,
    fontWeight: '500' as const,
    lineHeight: 16 * 1.5, // 24
  },
  bodySemibold: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 16 * 1.5, // 24
  },

  // Small text
  bodySmall: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 14 * 1.5, // 21
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 12 * 1.5, // 18
  },
  captionMedium: {
    fontSize: 12,
    fontWeight: '500' as const,
    lineHeight: 12 * 1.5, // 18
  },

  // Button text
  button: {
    fontSize: 16,
    fontWeight: '500' as const,
    lineHeight: 16 * 1.2, // 19.2
  },
  buttonLarge: {
    fontSize: 18,
    fontWeight: '500' as const,
    lineHeight: 18 * 1.2, // 21.6
  },

  // Legacy aliases (for backward compatibility)
  small: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
  },
};

// ============================================================================
// FONT WEIGHTS
// ============================================================================

export const fontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

// ============================================================================
// BORDER RADIUS
// ============================================================================

export const borderRadius = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 28,
  full: 9999,    // Pill-shaped
  circle: '50%' as const,
};

// ============================================================================
// SHADOWS / ELEVATION
// ============================================================================

export const shadows = {
  // No shadow
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },

  // Level 1 - Small cards, subtle elevation
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },

  // Level 2 - Main content cards
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },

  // Level 3 - Modals, floating elements
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },

  // Level 4 - FAB, highly elevated elements
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
};

// ============================================================================
// ICON SIZES
// ============================================================================

export const iconSizes = {
  xs: 16,   // Inline icons
  sm: 20,   // Cards, buttons
  md: 24,   // Navigation, primary actions
  lg: 32,   // Feature illustrations
  xl: 48,   // Empty states, onboarding
  '2xl': 64, // Hero illustrations
};

// ============================================================================
// ANIMATION
// ============================================================================

export const animation = {
  // Durations (in ms)
  duration: {
    fast: 150,       // Quick micro-interactions
    normal: 250,     // Standard transitions
    slow: 400,       // Complex animations
    verySlow: 800,   // Progress rings, dramatic reveals
  },

  // Easing functions
  easing: {
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
  },

  // Spring config (for Animated.spring)
  spring: {
    tension: 300,
    friction: 20,
  },
};

// ============================================================================
// COMPONENT SIZES
// ============================================================================

export const componentSizes = {
  // Button heights
  button: {
    small: 44,
    medium: 56,
    large: 64,
  },

  // Input heights
  input: {
    small: 44,
    medium: 52,
    large: 60,
  },

  // Avatar sizes
  avatar: {
    xs: 24,
    sm: 32,
    md: 44,
    lg: 64,
    xl: 80,
  },

  // Icon button / FAB sizes
  iconButton: {
    small: 36,
    medium: 44,
    large: 56,
    fab: 56,
  },

  // Progress ring sizes
  progressRing: {
    small: 60,
    medium: 100,
    large: 140,
  },

  // Tab bar
  tabBar: {
    height: 60,
    iconSize: 24,
  },

  // Header
  header: {
    height: 60,
  },
};

// ============================================================================
// LAYOUT
// ============================================================================

export const layout = {
  // Screen padding
  screenPadding: {
    horizontal: 20,
    vertical: 16,
  },

  // Card padding
  cardPadding: {
    small: 16,
    medium: 20,
    large: 24,
  },

  // Section spacing
  sectionSpacing: {
    small: 24,
    medium: 32,
    large: 40,
  },

  // Grid gaps
  gridGap: {
    small: 8,
    medium: 12,
    large: 16,
  },

  // Base window dimensions (for reference)
  window: {
    width: 375,  // iPhone base width
    height: 812, // iPhone base height
  },
};

// ============================================================================
// ACCESSIBILITY
// ============================================================================

export const accessibility = {
  // Minimum touch target size (iOS HIG)
  minTouchTarget: 44,

  // Recommended touch target
  recommendedTouchTarget: 56,

  // Minimum font sizes
  minFontSize: {
    body: 16,
    caption: 12,
  },

  // Color contrast ratios (WCAG AA)
  contrastRatio: {
    normalText: 4.5,  // 4.5:1 minimum
    largeText: 3.0,   // 3:1 for 18px+ or 14px bold+
    uiComponents: 3.0, // 3:1 for UI elements
  },
};

// ============================================================================
// EXPORTS
// ============================================================================

// Default export with all theme values
export default {
  colors,
  spacing,
  typography,
  fontWeight,
  borderRadius,
  shadows,
  iconSizes,
  animation,
  componentSizes,
  layout,
  accessibility,
};
