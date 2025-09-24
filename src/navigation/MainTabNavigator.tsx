import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { MainTabParamList, ChatStackParamList, NutritionTabParamList, WorkoutStackParamList, ProgressStackParamList, ProfileStackParamList } from './types';
import { colors, typography } from '../constants/theme';

// Import screens
import ChatScreen from '../screens/chat/ChatScreen';
import FoodFeedScreen from '../screens/nutrition/FoodFeedScreen';
import MealPlanScreen from '../screens/nutrition/MealPlanScreen';
import GroceryListScreen from '../screens/nutrition/GroceryListScreen';
import TodayWorkoutScreen from '../screens/workout/TodayWorkoutScreen';
import WorkoutPlanScreen from '../screens/workout/WorkoutPlanScreen';
import StrengthTrackerScreen from '../screens/workout/StrengthTrackerScreen';
import MeasurementsScreen from '../screens/progress/MeasurementsScreen';
import PhotosScreen from '../screens/progress/PhotosScreen';
import AnalyticsScreen from '../screens/progress/AnalyticsScreen';
import ProfileMainScreen from '../screens/profile/ProfileMainScreen';
import SettingsScreen from '../screens/profile/SettingsScreen';
import JourneyScreen from '../screens/profile/JourneyScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();
const ChatStack = createStackNavigator<ChatStackParamList>();
const NutritionTopTab = createMaterialTopTabNavigator<NutritionTabParamList>();
const WorkoutStack = createStackNavigator<WorkoutStackParamList>();
const ProgressStack = createStackNavigator<ProgressStackParamList>();
const ProfileStack = createStackNavigator<ProfileStackParamList>();

// Chat Stack Navigator
function ChatNavigator() {
  return (
    <ChatStack.Navigator screenOptions={{ headerShown: false }}>
      <ChatStack.Screen name="ChatScreen" component={ChatScreen} />
    </ChatStack.Navigator>
  );
}

// Nutrition Top Tab Navigator
function NutritionNavigator() {
  return (
    <NutritionTopTab.Navigator
      screenOptions={{
        tabBarStyle: { backgroundColor: colors.surface },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarIndicatorStyle: { backgroundColor: colors.primary },
        tabBarLabelStyle: { ...typography.caption, fontWeight: '600' },
      }}
    >
      <NutritionTopTab.Screen 
        name="FoodFeed" 
        component={FoodFeedScreen}
        options={{ tabBarLabel: 'Feed' }}
      />
      <NutritionTopTab.Screen 
        name="MealPlan" 
        component={MealPlanScreen}
        options={{ tabBarLabel: 'Plan' }}
      />
      <NutritionTopTab.Screen 
        name="GroceryList" 
        component={GroceryListScreen}
        options={{ tabBarLabel: 'Shopping' }}
      />
    </NutritionTopTab.Navigator>
  );
}

// Workout Stack Navigator
function WorkoutNavigator() {
  return (
    <WorkoutStack.Navigator screenOptions={{ headerShown: false }}>
      <WorkoutStack.Screen name="TodayWorkout" component={TodayWorkoutScreen} />
      <WorkoutStack.Screen name="WorkoutPlan" component={WorkoutPlanScreen} />
      <WorkoutStack.Screen name="StrengthTracker" component={StrengthTrackerScreen} />
    </WorkoutStack.Navigator>
  );
}

// Progress Stack Navigator
function ProgressNavigator() {
  return (
    <ProgressStack.Navigator screenOptions={{ headerShown: false }}>
      <ProgressStack.Screen name="Measurements" component={MeasurementsScreen} />
      <ProgressStack.Screen name="Photos" component={PhotosScreen} />
      <ProgressStack.Screen name="Analytics" component={AnalyticsScreen} />
    </ProgressStack.Navigator>
  );
}

// Profile Stack Navigator
function ProfileNavigator() {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="ProfileMain" component={ProfileMainScreen} />
      <ProfileStack.Screen name="Settings" component={SettingsScreen} />
      <ProfileStack.Screen name="Journey" component={JourneyScreen} />
    </ProfileStack.Navigator>
  );
}

// Main Tab Navigator
export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          borderTopWidth: 1,
        },
        tabBarLabelStyle: {
          ...typography.caption,
          fontWeight: '500',
        },
      }}
    >
      <Tab.Screen 
        name="Chat" 
        component={ChatNavigator}
        options={{ 
          tabBarLabel: 'Chat',
          tabBarIcon: () => null, // We'll add icons later
        }}
      />
      <Tab.Screen 
        name="Nutrition" 
        component={NutritionNavigator}
        options={{ 
          tabBarLabel: 'Nutrition',
          tabBarIcon: () => null,
        }}
      />
      <Tab.Screen 
        name="Workout" 
        component={WorkoutNavigator}
        options={{ 
          tabBarLabel: 'Workout',
          tabBarIcon: () => null,
        }}
      />
      <Tab.Screen 
        name="Progress" 
        component={ProgressNavigator}
        options={{ 
          tabBarLabel: 'Progress',
          tabBarIcon: () => null,
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileNavigator}
        options={{ 
          tabBarLabel: 'Profile',
          tabBarIcon: () => null,
        }}
      />
    </Tab.Navigator>
  );
}