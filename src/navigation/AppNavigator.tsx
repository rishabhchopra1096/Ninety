import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { RootStackParamList } from './types';

// Import navigators
import OnboardingNavigator from './OnboardingNavigator';
import MainTabNavigator from './MainTabNavigator';

const RootStack = createStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  // TODO: Add logic to check if user has completed onboarding
  const hasCompletedOnboarding = true;

  return (
    <NavigationContainer>
      <RootStack.Navigator
        screenOptions={{
          headerShown: false,
          cardStyleInterpolator: ({ current }) => ({
            cardStyle: {
              opacity: current.progress,
            },
          }),
        }}
      >
        {!hasCompletedOnboarding ? (
          <RootStack.Screen name="Onboarding" component={OnboardingNavigator} />
        ) : (
          <RootStack.Screen name="Main" component={MainTabNavigator} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}