/**
 * StatCard Component
 * Based on CalAI design system
 *
 * Small metric card with progress ring and value display
 * Used for protein, carbs, fats, and other metrics
 *
 * Usage:
 * <StatCard
 *   value="168g"
 *   label="Protein left"
 *   progress={0.65}
 *   color={colors.macro.protein}
 * />
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Card } from './Card';
import { ProgressRing } from './ProgressRing';
import { colors, typography, spacing } from '../constants/theme';

export interface StatCardProps {
  /** Metric value (e.g., "168g", "1,926") */
  value: string | number;

  /** Label text */
  label: string;

  /** Progress value between 0 and 1 */
  progress: number;

  /** Progress ring color */
  color?: string;

  /** Optional icon/emoji */
  icon?: React.ReactNode;

  /** Ring size */
  ringSize?: 'small' | 'medium';

  /** Custom container style */
  style?: ViewStyle;

  /** Custom value text style */
  valueStyle?: TextStyle;

  /** Custom label text style */
  labelStyle?: TextStyle;
}

export const StatCard: React.FC<StatCardProps> = ({
  value,
  label,
  progress,
  color = colors.secondary,
  icon,
  ringSize = 'small',
  style,
  valueStyle,
  labelStyle,
}) => {
  return (
    <Card
      elevation="sm"
      padding="small"
      radius="md"
      style={[styles.container, style]}
    >
      {/* Progress Ring */}
      <View style={styles.ringContainer}>
        <ProgressRing size={ringSize} progress={progress} color={color}>
          {icon && <View style={styles.iconContainer}>{icon}</View>}
        </ProgressRing>
      </View>

      {/* Value */}
      <Text style={[styles.value, valueStyle]}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </Text>

      {/* Label */}
      <Text style={[styles.label, labelStyle]}>{label}</Text>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
    minHeight: 120,
  },
  ringContainer: {
    marginBottom: spacing[3],
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  value: {
    ...typography.h3,
    color: colors.primary,
    marginBottom: spacing[1],
  },
  label: {
    ...typography.bodySmall,
    color: colors.neutral[500],
    textAlign: 'center',
  },
});

export default StatCard;
