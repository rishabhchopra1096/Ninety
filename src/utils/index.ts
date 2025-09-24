import Constants from 'expo-constants';

export const generateAPIUrl = (relativePath: string) => {
  const path = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;

  // Always use external API URL if provided (works with Expo Go)
  if (process.env.EXPO_PUBLIC_API_BASE_URL) {
    console.log('🌐 Using external API URL:', process.env.EXPO_PUBLIC_API_BASE_URL);
    return process.env.EXPO_PUBLIC_API_BASE_URL.concat(path);
  }

  // Fallback to local development (requires custom dev build, not Expo Go)
  if (process.env.NODE_ENV === 'development') {
    const origin = Constants.experienceUrl?.replace('exp://', 'http://') || 'http://localhost:8081';
    console.log('⚠️  Using local API (requires custom dev build):', `${origin}${path}`);
    return `${origin}${path}`;
  }

  throw new Error(
    'EXPO_PUBLIC_API_BASE_URL environment variable is required for production',
  );
};