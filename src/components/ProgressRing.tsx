/**
 * ProgressRing Component
 * Based on CalAI design system
 *
 * Circular progress indicator with customizable size, color, and stroke width
 *
 * Usage:
 * <ProgressRing size="medium" progress={0.75} color={colors.secondary}>
 *   <Text style={styles.centerText}>75%</Text>
 * </ProgressRing>
 */

import React, { useEffect, useRef } from 'react';
import { View, Animated, Easing, StyleSheet, ViewStyle } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors, componentSizes, animation } from '../constants/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export interface ProgressRingProps {
  /** Progress value between 0 and 1 */
  progress: number;

  /** Ring size */
  size?: 'small' | 'medium' | 'large' | number;

  /** Progress color */
  color?: string;

  /** Background ring color */
  backgroundColor?: string;

  /** Stroke width */
  strokeWidth?: number;

  /** Center content */
  children?: React.ReactNode;

  /** Animate on mount */
  animated?: boolean;

  /** Custom container style */
  style?: ViewStyle;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  progress,
  size = 'medium',
  color = colors.secondary,
  backgroundColor = colors.neutral[200],
  strokeWidth = 8,
  children,
  animated = true,
  style,
}) => {
  // Get size value
  const sizeValue =
    typeof size === 'number'
      ? size
      : componentSizes.progressRing[size] || componentSizes.progressRing.medium;

  // Calculate dimensions
  const radius = (sizeValue - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = sizeValue / 2;

  // Animated value for progress
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Animated stroke offset
  const strokeDashoffset = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, circumference * (1 - progress)],
  });

  useEffect(() => {
    if (animated) {
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: animation.duration.verySlow,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        useNativeDriver: true,
      }).start();
    } else {
      progressAnim.setValue(1);
    }
  }, [progress, animated]);

  return (
    <View style={[styles.container, { width: sizeValue, height: sizeValue }, style]}>
      {/* SVG Ring */}
      <Svg width={sizeValue} height={sizeValue}>
        {/* Background ring */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
          fill="none"
        />

        {/* Progress ring */}
        <AnimatedCircle
          cx={center}
          cy={center}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${center}, ${center}`}
        />
      </Svg>

      {/* Center content */}
      {children && <View style={styles.centerContent}>{children}</View>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContent: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ProgressRing;
