import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../../constants/theme';

export default function ScheduleScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Schedule Screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  text: {
    ...typography.h2,
    color: colors.text,
  },
});