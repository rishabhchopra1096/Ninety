import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { OnboardingStackParamList } from './types';

// Import screens
import WelcomeScreen from '../screens/onboarding/WelcomeScreen';
import GoalsScreen from '../screens/onboarding/GoalsScreen';
import ScheduleScreen from '../screens/onboarding/ScheduleScreen';
import PrepWeekPlanScreen from '../screens/onboarding/PrepWeekPlanScreen';
import AccountSetupScreen from '../screens/onboarding/AccountSetupScreen';

const Stack = createStackNavigator<OnboardingStackParamList>();

export default function OnboardingNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyleInterpolator: ({ current }) => ({
          cardStyle: {
            opacity: current.progress,
          },
        }),
      }}
    >
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Goals" component={GoalsScreen} />
      <Stack.Screen name="Schedule" component={ScheduleScreen} />
      <Stack.Screen name="PrepWeekPlan" component={PrepWeekPlanScreen} />
      <Stack.Screen name="AccountSetup" component={AccountSetupScreen} />
    </Stack.Navigator>
  );
}