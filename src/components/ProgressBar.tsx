/**
 * ProgressBar Component
 * Based on CalAI design system
 *
 * Linear progress indicator
 *
 * Usage:
 * <ProgressBar progress={0.65} color={colors.secondary} />
 * <ProgressBar progress={0.75} color={colors.macro.protein} height={6} />
 */

import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle, Easing } from 'react-native';
import { colors, borderRadius, animation } from '../constants/theme';

export interface ProgressBarProps {
  /** Progress value between 0 and 1 */
  progress: number;

  /** Progress bar color */
  color?: string;

  /** Background color */
  backgroundColor?: string;

  /** Height of the progress bar */
  height?: number;

  /** Animate on mount/update */
  animated?: boolean;

  /** Custom container style */
  style?: ViewStyle;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  color = colors.primary,
  backgroundColor = colors.neutral[200],
  height = 4,
  animated = true,
  style,
}) => {
  // Clamp progress between 0 and 1
  const clampedProgress = Math.max(0, Math.min(1, progress));

  // Animated value for progress
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Animated width percentage
  const widthPercentage = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  useEffect(() => {
    if (animated) {
      Animated.timing(progressAnim, {
        toValue: clampedProgress,
        duration: animation.duration.slow,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        useNativeDriver: false, // width animations don't support native driver
      }).start();
    } else {
      progressAnim.setValue(clampedProgress);
    }
  }, [clampedProgress, animated]);

  return (
    <View
      style={[
        styles.container,
        {
          height,
          backgroundColor,
          borderRadius: height / 2, // Rounded ends
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.fill,
          {
            width: widthPercentage,
            backgroundColor: color,
            borderRadius: height / 2,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    width: '100%',
  },
  fill: {
    height: '100%',
  },
});

export default ProgressBar;
