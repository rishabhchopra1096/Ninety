import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../contexts/AuthContext';
import { colors, spacing, typography, borderRadius } from '../../constants/theme';
import { Button } from '../../components';

type RootStackParamList = {
  Login: undefined;
};

type SignupScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface SignupScreenProps {
  navigation: SignupScreenNavigationProp;
}

export default function SignupScreen({ navigation }: SignupScreenProps) {
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    // Validation
    if (!email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setLoading(true);
    const result = await signUp(email, password);
    setLoading(false);

    if (!result.success) {
      Alert.alert('Signup Failed', result.error);
    }
    // If successful, AuthContext will update and user will be logged in automatically
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          {/* Logo/Title */}
          <View style={styles.header}>
            <Text style={styles.title}>Ninety</Text>
            <Text style={styles.subtitle}>Transform in 90 Days</Text>
          </View>

          {/* Input Fields */}
          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={colors.neutral[500]}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!loading}
            />

            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={colors.neutral[500]}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              editable={!loading}
            />

            <TextInput
              style={styles.input}
              placeholder="Confirm Password"
              placeholderTextColor={colors.neutral[500]}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoCapitalize="none"
              editable={!loading}
            />

            {/* Sign Up Button - Using CalAI Design System */}
            <Button
              variant="primary"
              size="large"
              onPress={handleSignup}
              disabled={loading}
              loading={loading}
              style={styles.signupButton}
            >
              Sign Up
            </Button>

            {/* Login Link - Using Ghost Variant */}
            <Button
              variant="ghost"
              size="medium"
              onPress={() => navigation.navigate('Login')}
              disabled={loading}
              style={styles.loginButton}
            >
              Already have an account? Log In
            </Button>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing[6],
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing[10],
  },
  title: {
    ...typography.display,
    fontSize: 48,
    color: colors.primary,
    marginBottom: spacing[2],
  },
  subtitle: {
    ...typography.body,
    color: colors.neutral[500],
  },
  form: {
    width: '100%',
  },
  input: {
    backgroundColor: colors.neutral[50],
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
    fontSize: 16,
    color: colors.primary,
    marginBottom: spacing[4],
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  signupButton: {
    marginTop: spacing[4],
  },
  loginButton: {
    marginTop: spacing[5],
  },
});
