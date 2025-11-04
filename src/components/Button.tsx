/**
 * Button Component
 * Based on CalAI design system
 *
 * Variants:
 * - primary: Black background, white text (main CTA)
 * - secondary: White background, black text, bordered
 * - ghost: Transparent background, black text
 *
 * Usage:
 * <Button variant="primary" onPress={handleSubmit}>Continue</Button>
 * <Button variant="secondary" onPress={handleCancel}>Cancel</Button>
 * <Button variant="ghost" onPress={handleLink}>Learn more</Button>
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TouchableOpacityProps,
} from 'react-native';
import { colors, typography, borderRadius, componentSizes, shadows } from '../constants/theme';

export interface ButtonProps extends TouchableOpacityProps {
  /** Button variant */
  variant?: 'primary' | 'secondary' | 'ghost';

  /** Button size */
  size?: 'small' | 'medium' | 'large';

  /** Button text/children */
  children: React.ReactNode;

  /** Loading state */
  loading?: boolean;

  /** Disabled state */
  disabled?: boolean;

  /** Custom button style */
  style?: ViewStyle;

  /** Custom text style */
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'medium',
  children,
  loading = false,
  disabled = false,
  style,
  textStyle,
  onPress,
  ...rest
}) => {
  const isDisabled = disabled || loading;

  const buttonStyles: ViewStyle[] = [
    styles.base,
    styles[`${variant}Base`],
    styles[`size${size.charAt(0).toUpperCase() + size.slice(1)}`],
    isDisabled && styles[`${variant}Disabled`],
    style,
  ];

  const textStyles: TextStyle[] = [
    styles.text,
    styles[`${variant}Text`],
    size === 'large' && styles.textLarge,
    isDisabled && styles[`${variant}TextDisabled`],
    textStyle,
  ];

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
          color={variant === 'primary' ? colors.background : colors.primary}
          size="small"
        />
      ) : (
        <Text style={textStyles}>{children}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // Base styles
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.full, // Pill-shaped
    paddingHorizontal: 24,
  },

  // Size variants
  sizeSmall: {
    height: componentSizes.button.small,
    paddingHorizontal: 16,
  },
  sizeMedium: {
    height: componentSizes.button.medium,
    paddingHorizontal: 24,
  },
  sizeLarge: {
    height: componentSizes.button.large,
    paddingHorizontal: 28,
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

  // Text styles
  text: {
    ...typography.button,
    textAlign: 'center',
  },
  textLarge: {
    ...typography.buttonLarge,
  },

  // Primary text
  primaryText: {
    color: colors.background,
  },
  primaryTextDisabled: {
    color: colors.neutral[400],
  },

  // Secondary text
  secondaryText: {
    color: colors.primary,
  },
  secondaryTextDisabled: {
    color: colors.neutral[400],
  },

  // Ghost text
  ghostText: {
    color: colors.primary,
  },
  ghostTextDisabled: {
    color: colors.neutral[400],
  },
});

export default Button;
