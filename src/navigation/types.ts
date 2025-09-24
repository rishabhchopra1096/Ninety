import { NavigatorScreenParams } from '@react-navigation/native';

// Main App Tab Navigator
export type MainTabParamList = {
  Chat: NavigatorScreenParams<ChatStackParamList>;
  Nutrition: NavigatorScreenParams<NutritionTabParamList>;
  Workout: NavigatorScreenParams<WorkoutStackParamList>;
  Progress: NavigatorScreenParams<ProgressStackParamList>;
  Profile: NavigatorScreenParams<ProfileStackParamList>;
};

// Chat Stack
export type ChatStackParamList = {
  ChatScreen: undefined;
};

// Nutrition Top Tabs
export type NutritionTabParamList = {
  FoodFeed: undefined;
  MealPlan: undefined;
  GroceryList: undefined;
};

// Workout Stack
export type WorkoutStackParamList = {
  TodayWorkout: undefined;
  WorkoutPlan: undefined;
  StrengthTracker: undefined;
};

// Progress Stack
export type ProgressStackParamList = {
  Measurements: undefined;
  Photos: undefined;
  Analytics: undefined;
};

// Profile Stack
export type ProfileStackParamList = {
  ProfileMain: undefined;
  Settings: undefined;
  Journey: undefined;
};

// Onboarding Stack
export type OnboardingStackParamList = {
  Welcome: undefined;
  Goals: undefined;
  Schedule: undefined;
  PrepWeekPlan: undefined;
  AccountSetup: undefined;
};

// Root Stack
export type RootStackParamList = {
  Onboarding: NavigatorScreenParams<OnboardingStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}