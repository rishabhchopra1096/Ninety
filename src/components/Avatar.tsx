/**
 * Avatar Component
 * Based on CalAI design system
 *
 * Circular avatar with image, initials, or icon
 *
 * Usage:
 * <Avatar source={{ uri: userPhotoUrl }} size="md" />
 * <Avatar initials="RC" size="lg" backgroundColor={colors.secondary} />
 * <Avatar icon={<UserIcon />} size="sm" />
 */

import React from 'react';
import {
  View,
  Image,
  Text,
  ImageSourcePropType,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { colors, typography, componentSizes } from '../constants/theme';

export interface AvatarProps {
  /** Image source */
  source?: ImageSourcePropType;

  /** Initials to display if no image */
  initials?: string;

  /** Icon component to display if no image or initials */
  icon?: React.ReactNode;

  /** Avatar size */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;

  /** Background color (for initials/icon) */
  backgroundColor?: string;

  /** Text color (for initials) */
  textColor?: string;

  /** Border width */
  borderWidth?: number;

  /** Border color */
  borderColor?: string;

  /** Custom container style */
  style?: ViewStyle;

  /** Custom text style */
  textStyle?: TextStyle;
}

export const Avatar: React.FC<AvatarProps> = ({
  source,
  initials,
  icon,
  size = 'md',
  backgroundColor = colors.secondary,
  textColor = colors.background,
  borderWidth = 0,
  borderColor = colors.background,
  style,
  textStyle,
}) => {
  // Get size value
  const sizeValue =
    typeof size === 'number' ? size : componentSizes.avatar[size] || componentSizes.avatar.md;

  const containerStyles: ViewStyle[] = [
    styles.container,
    {
      width: sizeValue,
      height: sizeValue,
      borderRadius: sizeValue / 2,
      backgroundColor: source ? 'transparent' : backgroundColor,
      borderWidth,
      borderColor,
    },
    style,
  ];

  // Calculate font size based on avatar size
  const fontSize =
    typeof size === 'number'
      ? size * 0.4
      : size === 'xs'
      ? 10
      : size === 'sm'
      ? 12
      : size === 'md'
      ? 16
      : size === 'lg'
      ? 24
      : 32;

  const textStyles: TextStyle[] = [
    styles.text,
    {
      fontSize,
      color: textColor,
    },
    textStyle,
  ];

  return (
    <View style={containerStyles}>
      {source ? (
        // Image avatar
        <Image
          source={source}
          style={[
            styles.image,
            {
              width: sizeValue,
              height: sizeValue,
              borderRadius: sizeValue / 2,
            },
          ]}
          resizeMode="cover"
        />
      ) : initials ? (
        // Initials avatar
        <Text style={textStyles}>{initials.substring(0, 2).toUpperCase()}</Text>
      ) : icon ? (
        // Icon avatar
        <View style={styles.iconContainer}>{icon}</View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  image: {
    // Size is set dynamically
  },
  text: {
    fontWeight: '500',
    textAlign: 'center',
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default Avatar;
