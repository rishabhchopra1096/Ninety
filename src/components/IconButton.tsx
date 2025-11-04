/**
 * IconButton Component
 * Based on CalAI design system
 *
 * Circular icon button, including FAB (Floating Action Button)
 *
 * Usage:
 * <IconButton icon="plus" onPress={handleAdd} />
 * <IconButton icon="camera" variant="secondary" onPress={handlePhoto} />
 * <IconButton icon="plus" variant="fab" onPress={handleFAB} />
 */

import React from 'react';
import {
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TouchableOpacityProps,
} from 'react-native';
import { colors, componentSizes, shadows } from '../constants/theme';

export interface IconButtonProps extends TouchableOpacityProps {
  /** Icon component (e.g., from Lucide or Vector Icons) */
  icon: React.ReactNode;

  /** Button variant */
  variant?: 'primary' | 'secondary' | 'ghost' | 'fab';

  /** Button size */
  size?: 'small' | 'medium' | 'large';

  /** Loading state */
  loading?: boolean;

  /** Disabled state */
  disabled?: boolean;

  /** Custom background color */
  backgroundColor?: string;

  /** Custom icon color */
  iconColor?: string;

  /** Custom button style */
  style?: ViewStyle;
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  backgroundColor,
  iconColor,
  style,
  onPress,
  ...rest
}) => {
  const isDisabled = disabled || loading;
  const isFAB = variant === 'fab';

  // Get size value
  const sizeValue = isFAB
    ? componentSizes.iconButton.fab
    : componentSizes.iconButton[size];

  const buttonStyles: ViewStyle[] = [
    styles.base,
    styles[`${variant}Base`],
    {
      width: sizeValue,
      height: sizeValue,
      borderRadius: sizeValue / 2,
    },
    isDisabled && styles[`${variant}Disabled`],
    backgroundColor && { backgroundColor },
    style,
  ];

  // Determine icon color based on variant and props
  const defaultIconColor =
    variant === 'primary' || variant === 'fab'
      ? colors.background
      : variant === 'secondary'
      ? colors.primary
      : colors.neutral[500];

  const finalIconColor = iconColor || defaultIconColor;

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator
          color={finalIconColor}
          size="small"
        />
      ) : (
        // Pass iconColor as prop if icon accepts it (for icon libraries)
        React.isValidElement(icon)
          ? React.cloneElement(icon as React.ReactElement<any>, {
              color: finalIconColor,
              size: size === 'small' ? 20 : size === 'large' ? 28 : 24,
            })
          : icon
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // Base styles
  base: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Primary variant
  primaryBase: {
    backgroundColor: colors.primary,
    ...shadows.sm,
  },
  primaryDisabled: {
    backgroundColor: colors.neutral[300],
    ...shadows.none,
  },

  // Secondary variant
  secondaryBase: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  secondaryDisabled: {
    backgroundColor: colors.neutral[100],
    borderColor: colors.neutral[200],
  },

  // Ghost variant
  ghostBase: {
    backgroundColor: 'transparent',
  },
  ghostDisabled: {
    backgroundColor: 'transparent',
  },

  // FAB variant (Floating Action Button)
  fabBase: {
    backgroundColor: colors.primary,
    ...shadows.xl,
  },
  fabDisabled: {
    backgroundColor: colors.neutral[300],
    ...shadows.sm,
  },
});

export default IconButton;
