/**
 * Card Component
 * Based on CalAI design system
 *
 * A flexible card container with elevation/shadow
 *
 * Usage:
 * <Card>
 *   <Text>Card content</Text>
 * </Card>
 *
 * <Card elevation="lg" padding="large">
 *   <Text>Elevated card with more padding</Text>
 * </Card>
 */

import React from 'react';
import { View, StyleSheet, ViewStyle, ViewProps } from 'react-native';
import { colors, borderRadius, shadows, layout } from '../constants/theme';

export interface CardProps extends ViewProps {
  /** Card content */
  children: React.ReactNode;

  /** Shadow/elevation level */
  elevation?: 'none' | 'sm' | 'md' | 'lg' | 'xl';

  /** Padding size */
  padding?: 'none' | 'small' | 'medium' | 'large';

  /** Border radius size */
  radius?: 'sm' | 'md' | 'lg' | 'xl';

  /** Custom background color */
  backgroundColor?: string;

  /** Custom style */
  style?: ViewStyle;
}

export const Card: React.FC<CardProps> = ({
  children,
  elevation = 'md',
  padding = 'medium',
  radius = 'lg',
  backgroundColor,
  style,
  ...rest
}) => {
  const cardStyles: ViewStyle[] = [
    styles.base,
    shadows[elevation],
    styles[`padding${padding.charAt(0).toUpperCase() + padding.slice(1)}`],
    styles[`radius${radius.charAt(0).toUpperCase() + radius.slice(1)}`],
    backgroundColor && { backgroundColor },
    style,
  ];

  return (
    <View style={cardStyles} {...rest}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.background,
  },

  // Padding variants
  paddingNone: {
    padding: 0,
  },
  paddingSmall: {
    padding: layout.cardPadding.small,
  },
  paddingMedium: {
    padding: layout.cardPadding.medium,
  },
  paddingLarge: {
    padding: layout.cardPadding.large,
  },

  // Radius variants
  radiusSm: {
    borderRadius: borderRadius.sm,
  },
  radiusMd: {
    borderRadius: borderRadius.md,
  },
  radiusLg: {
    borderRadius: borderRadius.lg,
  },
  radiusXl: {
    borderRadius: borderRadius.xl,
  },
});

export default Card;
