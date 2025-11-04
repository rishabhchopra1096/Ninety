/**
 * Badge Component
 * Based on CalAI design system
 *
 * Small status indicators, labels, and streak badges
 *
 * Usage:
 * <Badge variant="filled" color="success">Healthy</Badge>
 * <Badge variant="outlined">Recommended</Badge>
 * <Badge variant="streak" count={15} />
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { colors, typography, spacing, borderRadius, iconSizes } from '../constants/theme';

export interface BadgeProps {
  /** Badge variant */
  variant?: 'filled' | 'outlined' | 'streak';

  /** Badge color (for filled and outlined) */
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'neutral';

  /** Badge text */
  children?: React.ReactNode;

  /** Streak count (for streak variant) */
  count?: number;

  /** Icon/emoji to display */
  icon?: string | React.ReactNode;

  /** Size */
  size?: 'small' | 'medium' | 'large';

  /** Custom container style */
  style?: ViewStyle;

  /** Custom text style */
  textStyle?: TextStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'outlined',
  color = 'neutral',
  children,
  count,
  icon,
  size = 'medium',
  style,
  textStyle,
}) => {
  // Streak badge special handling
  if (variant === 'streak') {
    return (
      <View style={[styles.streakContainer, style]}>
        <Text style={styles.streakIcon}>🔥</Text>
        <Text style={styles.streakCount}>{count || 0}</Text>
      </View>
    );
  }

  const containerStyles: ViewStyle[] = [
    styles.base,
    styles[`${variant}Base`],
    styles[`${variant}${color.charAt(0).toUpperCase() + color.slice(1)}`],
    styles[`size${size.charAt(0).toUpperCase() + size.slice(1)}`],
    style,
  ];

  const textStyles: TextStyle[] = [
    styles.text,
    styles[`${variant}Text`],
    styles[`${variant}Text${color.charAt(0).toUpperCase() + color.slice(1)}`],
    styles[`textSize${size.charAt(0).toUpperCase() + size.slice(1)}`],
    textStyle,
  ];

  return (
    <View style={containerStyles}>
      {icon && (
        <View style={styles.iconContainer}>
          {typeof icon === 'string' ? (
            <Text style={styles.iconText}>{icon}</Text>
          ) : (
            icon
          )}
        </View>
      )}
      {children && <Text style={textStyles}>{children}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  // Base styles
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: borderRadius.full,
  },

  // Size variants
  sizeSmall: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
  },
  sizeMedium: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
  },
  sizeLarge: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
  },

  // Filled variant bases
  filledBase: {},
  filledPrimary: {
    backgroundColor: colors.primary,
  },
  filledSecondary: {
    backgroundColor: colors.secondary,
  },
  filledSuccess: {
    backgroundColor: colors.status.success,
  },
  filledWarning: {
    backgroundColor: colors.status.warning,
  },
  filledError: {
    backgroundColor: colors.status.error,
  },
  filledNeutral: {
    backgroundColor: colors.neutral[500],
  },

  // Outlined variant bases
  outlinedBase: {
    backgroundColor: colors.background,
    borderWidth: 1,
  },
  outlinedPrimary: {
    borderColor: colors.primary,
  },
  outlinedSecondary: {
    borderColor: colors.secondary,
  },
  outlinedSuccess: {
    borderColor: colors.status.success,
  },
  outlinedWarning: {
    borderColor: colors.status.warning,
  },
  outlinedError: {
    borderColor: colors.status.error,
  },
  outlinedNeutral: {
    borderColor: colors.neutral[200],
  },

  // Text styles
  text: {
    ...typography.caption,
    fontWeight: '500',
  },
  textSizeSmall: {
    fontSize: 10,
  },
  textSizeMedium: {
    fontSize: 12,
  },
  textSizeLarge: {
    fontSize: 14,
  },

  // Filled text colors
  filledText: {},
  filledTextPrimary: {
    color: colors.background,
  },
  filledTextSecondary: {
    color: colors.background,
  },
  filledTextSuccess: {
    color: colors.background,
  },
  filledTextWarning: {
    color: colors.background,
  },
  filledTextError: {
    color: colors.background,
  },
  filledTextNeutral: {
    color: colors.background,
  },

  // Outlined text colors
  outlinedText: {},
  outlinedTextPrimary: {
    color: colors.primary,
  },
  outlinedTextSecondary: {
    color: colors.secondary,
  },
  outlinedTextSuccess: {
    color: colors.status.success,
  },
  outlinedTextWarning: {
    color: colors.status.warning,
  },
  outlinedTextError: {
    color: colors.status.error,
  },
  outlinedTextNeutral: {
    color: colors.neutral[600],
  },

  // Icon
  iconContainer: {
    marginRight: spacing[1],
  },
  iconText: {
    fontSize: iconSizes.xs,
  },

  // Streak badge (special)
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  streakIcon: {
    fontSize: iconSizes.sm,
    marginRight: spacing[1],
  },
  streakCount: {
    ...typography.body,
    fontWeight: '600',
    color: colors.primary,
  },
});

export default Badge;
