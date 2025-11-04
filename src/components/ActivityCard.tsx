/**
 * ActivityCard Component
 * Based on CalAI design system
 *
 * Card for displaying workout/activity entries
 *
 * Usage:
 * <ActivityCard
 *   icon="💪"
 *   title="Weight lifting"
 *   time="6:30pm"
 *   duration="15 Mins"
 *   intensity="Medium"
 *   calories={50}
 *   onPress={handlePress}
 * />
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { Card } from './Card';
import { colors, typography, spacing, iconSizes } from '../constants/theme';

export interface ActivityCardProps {
  /** Activity icon or emoji */
  icon?: string | React.ReactNode;

  /** Activity title */
  title: string;

  /** Time logged */
  time?: string;

  /** Duration */
  duration?: string;

  /** Intensity level */
  intensity?: string;

  /** Calories burned */
  calories?: number;

  /** Optional notes */
  notes?: string;

  /** On press handler */
  onPress?: () => void;

  /** Custom container style */
  style?: ViewStyle;
}

export const ActivityCard: React.FC<ActivityCardProps> = ({
  icon,
  title,
  time,
  duration,
  intensity,
  calories,
  notes,
  onPress,
  style,
}) => {
  const Content = (
    <Card elevation="sm" padding="small" radius="md" style={[styles.container, style]}>
      <View style={styles.content}>
        {/* Icon */}
        {icon && (
          <View style={styles.iconContainer}>
            {typeof icon === 'string' ? (
              <Text style={styles.iconText}>{icon}</Text>
            ) : (
              icon
            )}
          </View>
        )}

        {/* Text Content */}
        <View style={styles.textContent}>
          {/* Title and Time */}
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            {time && <Text style={styles.time}>{time}</Text>}
          </View>

          {/* Details Row */}
          <View style={styles.detailsRow}>
            {duration && (
              <View style={styles.detailItem}>
                <Text style={styles.detailIcon}>⏱️</Text>
                <Text style={styles.detailText}>{duration}</Text>
              </View>
            )}

            {intensity && (
              <View style={styles.detailItem}>
                <Text style={styles.detailIcon}>💨</Text>
                <Text style={styles.detailText}>Intensity: {intensity}</Text>
              </View>
            )}
          </View>

          {/* Calories */}
          {calories !== undefined && (
            <View style={styles.caloriesRow}>
              <Text style={styles.calorieIcon}>🔥</Text>
              <Text style={styles.calories}>{calories} calories</Text>
            </View>
          )}

          {/* Notes */}
          {notes && <Text style={styles.notes}>{notes}</Text>}
        </View>
      </View>
    </Card>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        {Content}
      </TouchableOpacity>
    );
  }

  return Content;
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing[3],
  },
  content: {
    flexDirection: 'row',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing[3],
  },
  iconText: {
    fontSize: iconSizes.lg,
  },
  textContent: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  title: {
    ...typography.body,
    fontWeight: '500',
    color: colors.primary,
    flex: 1,
  },
  time: {
    ...typography.caption,
    color: colors.neutral[500],
    marginLeft: spacing[2],
  },
  detailsRow: {
    flexDirection: 'row',
    gap: spacing[4],
    marginBottom: spacing[2],
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailIcon: {
    fontSize: iconSizes.sm,
    marginRight: spacing[1],
  },
  detailText: {
    ...typography.bodySmall,
    color: colors.neutral[500],
  },
  caloriesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  calorieIcon: {
    fontSize: iconSizes.sm,
    marginRight: spacing[1],
  },
  calories: {
    ...typography.body,
    fontWeight: '600',
    color: colors.primary,
  },
  notes: {
    ...typography.bodySmall,
    color: colors.neutral[500],
    fontStyle: 'italic',
  },
});

export default ActivityCard;
