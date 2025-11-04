import React from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import { Avatar, Card, Button } from '../../components';

export default function ProfileMainScreen() {
  const { user, signOut } = useAuth();

  const handleLogout = async () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            const result = await signOut();
            if (!result.success) {
              Alert.alert('Error', result.error);
            }
          },
        },
      ]
    );
  };

  // Get user initials from email
  const getInitials = (email: string | null | undefined) => {
    if (!email) return '??';
    const name = email.split('@')[0];
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Profile</Text>

        {/* Avatar with user initials */}
        <View style={styles.avatarContainer}>
          <Avatar
            initials={getInitials(user?.email)}
            size="xl"
            backgroundColor={colors.secondary}
          />
          {user?.email && (
            <Text style={styles.emailText}>{user.email}</Text>
          )}
        </View>

        {/* User Info Card */}
        {user && (
          <Card elevation="sm" padding="medium" radius="md" style={styles.infoCard}>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.value}>{user.email}</Text>
          </Card>
        )}

        {/* Logout Button with CalAI styling */}
        <Button
          variant="primary"
          size="large"
          onPress={handleLogout}
          style={styles.logoutButton}
        >
          Log Out
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: spacing[6],
  },
  title: {
    ...typography.h1,
    color: colors.primary,
    marginBottom: spacing[8],
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: spacing[8],
  },
  emailText: {
    ...typography.body,
    color: colors.neutral[500],
    marginTop: spacing[3],
  },
  infoCard: {
    marginBottom: spacing[6],
  },
  label: {
    ...typography.caption,
    color: colors.neutral[500],
    marginBottom: spacing[2],
  },
  value: {
    ...typography.body,
    color: colors.primary,
  },
  logoutButton: {
    marginTop: spacing[8],
  },
});