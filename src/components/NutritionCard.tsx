/**
 * NutritionCard Component
 * Based on CalAI design system
 *
 * Card for displaying meal/food entries with photo, macros, and calories
 *
 * Usage:
 * <NutritionCard
 *   image={{ uri: mealImageUrl }}
 *   title="Lemon Herb Salmon"
 *   time="9:00am"
 *   calories={520}
 *   protein={38}
 *   carbs={36}
 *   fats={26}
 *   onPress={handlePress}
 * />
 */

import React from 'react';
import {
  View,
  Text,
  Image,
  ImageSourcePropType,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { Card } from './Card';
import { colors, typography, spacing, borderRadius, iconSizes } from '../constants/theme';

export interface NutritionCardProps {
  /** Meal/food image */
  image?: ImageSourcePropType;

  /** Meal/food title */
  title: string;

  /** Time logged */
  time?: string;

  /** Calories */
  calories: number;

  /** Protein in grams (optional) */
  protein?: number;

  /** Carbs in grams (optional) */
  carbs?: number;

  /** Fats in grams (optional) */
  fats?: number;

  /** On press handler */
  onPress?: () => void;

  /** Custom container style */
  style?: ViewStyle;
}

export const NutritionCard: React.FC<NutritionCardProps> = ({
  image,
  title,
  time,
  calories,
  protein,
  carbs,
  fats,
  onPress,
  style,
}) => {
  const Content = (
    <Card elevation="sm" padding="small" radius="md" style={[styles.container, style]}>
      <View style={styles.content}>
        {/* Image */}
        {image && (
          <Image source={image} style={styles.image} resizeMode="cover" />
        )}

        {/* Text Content */}
        <View style={styles.textContent}>
          {/* Title and Time */}
          <View>
            <Text style={styles.title} numberOfLines={2}>
              {title}
            </Text>
            {time && <Text style={styles.time}>{time}</Text>}
          </View>

          {/* Calories */}
          <View style={styles.caloriesRow}>
            <Text style={styles.calorieIcon}>🔥</Text>
            <Text style={styles.calories}>{calories.toLocaleString()} calories</Text>
          </View>

          {/* Macros */}
          {(protein !== undefined || carbs !== undefined || fats !== undefined) && (
            <View style={styles.macrosRow}>
              {protein !== undefined && (
                <View style={styles.macroItem}>
                  <Text style={[styles.macroIcon, { color: colors.macro.protein }]}>
                    🍗
                  </Text>
                  <Text style={styles.macroText}>{protein}g</Text>
                </View>
              )}
              {carbs !== undefined && (
                <View style={styles.macroItem}>
                  <Text style={[styles.macroIcon, { color: colors.macro.carbs }]}>
                    🌾
                  </Text>
                  <Text style={styles.macroText}>{carbs}g</Text>
                </View>
              )}
              {fats !== undefined && (
                <View style={styles.macroItem}>
                  <Text style={[styles.macroIcon, { color: colors.macro.fats }]}>
                    🥑
                  </Text>
                  <Text style={styles.macroText}>{fats}g</Text>
                </View>
              )}
            </View>
          )}
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
  image: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.md,
    marginRight: spacing[3],
  },
  textContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  title: {
    ...typography.body,
    fontWeight: '500',
    color: colors.primary,
    marginBottom: spacing[1],
  },
  time: {
    ...typography.caption,
    color: colors.neutral[500],
    marginBottom: spacing[2],
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
  macrosRow: {
    flexDirection: 'row',
    gap: spacing[4],
  },
  macroItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  macroIcon: {
    fontSize: iconSizes.sm,
    marginRight: spacing[1],
  },
  macroText: {
    ...typography.bodySmall,
    color: colors.neutral[500],
  },
});

export default NutritionCard;
