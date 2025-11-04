/**
 * EmptyState Component
 * Based on CalAI design system
 *
 * Display empty states with icon, title, description, and optional action
 *
 * Usage:
 * <EmptyState
 *   icon="📭"
 *   title="No meals logged yet"
 *   description="Tap + to add your first meal of the day"
 * />
 *
 * <EmptyState
 *   icon={<InboxIcon size={48} />}
 *   title="No activities"
 *   description="Start logging your workouts"
 *   action={
 *     <Button variant="primary" onPress={handleAdd}>
 *       Log Activity
 *     </Button>
 *   }
 * />
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { colors, typography, spacing, iconSizes } from '../constants/theme';

export interface EmptyStateProps {
  /** Icon (emoji string or React element) */
  icon?: string | React.ReactNode;

  /** Title text */
  title: string;

  /** Description text */
  description?: string;

  /** Action button or component */
  action?: React.ReactNode;

  /** Icon size (only applies to emoji strings) */
  iconSize?: number;

  /** Background color for card style */
  backgroundColor?: string;

  /** Use card background */
  withCard?: boolean;

  /** Custom container style */
  style?: ViewStyle;

  /** Custom title style */
  titleStyle?: TextStyle;

  /** Custom description style */
  descriptionStyle?: TextStyle;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  iconSize = iconSizes.xl,
  backgroundColor,
  withCard = false,
  style,
  titleStyle,
  descriptionStyle,
}) => {
  const containerStyles: ViewStyle[] = [
    styles.container,
    withCard && styles.cardBackground,
    backgroundColor && { backgroundColor },
    style,
  ];

  return (
    <View style={containerStyles}>
      {/* Icon */}
      {icon && (
        <View style={styles.iconContainer}>
          {typeof icon === 'string' ? (
            <Text style={[styles.iconText, { fontSize: iconSize }]}>{icon}</Text>
          ) : (
            icon
          )}
        </View>
      )}

      {/* Title */}
      <Text style={[styles.title, titleStyle]}>{title}</Text>

      {/* Description */}
      {description && (
        <Text style={[styles.description, descriptionStyle]}>{description}</Text>
      )}

      {/* Action */}
      {action && <View style={styles.actionContainer}>{action}</View>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[6],
  },
  cardBackground: {
    backgroundColor: colors.neutral[50],
    borderRadius: 12,
  },
  iconContainer: {
    marginBottom: spacing[4],
  },
  iconText: {
    // fontSize set dynamically
  },
  title: {
    ...typography.body,
    fontWeight: '500',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: spacing[2],
  },
  description: {
    ...typography.bodySmall,
    color: colors.neutral[500],
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing[4],
  },
  actionContainer: {
    marginTop: spacing[2],
  },
});

export default EmptyState;
