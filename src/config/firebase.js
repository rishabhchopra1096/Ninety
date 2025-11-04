import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCyawmM_wrUwvOKbOnJccmnAB_z6MX7_g0",
  authDomain: "ninety-ed5a0.firebaseapp.com",
  projectId: "ninety-ed5a0",
  storageBucket: "ninety-ed5a0.firebasestorage.app",
  messagingSenderId: "154744833423",
  appId: "1:154744833423:web:ae765b87e3293f2b3277fa",
  measurementId: "G-04GMYCLE7Z"
};

// Initialize Firebase
console.log('🔥 Initializing Firebase...');
export const app = initializeApp(firebaseConfig);

// Initialize Auth with AsyncStorage persistence for React Native
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Storage
export const storage = getStorage(app);

console.log('✅ Firebase initialized successfully');
console.log('📦 Project:', firebaseConfig.projectId);
