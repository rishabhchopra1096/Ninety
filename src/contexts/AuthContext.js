import React, { createContext, useState, useEffect, useContext } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    console.log('🔐 Setting up auth state listener...');

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        console.log('✅ User authenticated:', firebaseUser.email);
        setUser(firebaseUser);

        // Fetch user profile from Firestore
        try {
          console.log('📄 Fetching user profile from Firestore...');
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            setUserProfile(userDoc.data());
            console.log('✅ User profile loaded');
          } else {
            console.log('⚠️ No user profile found in Firestore');
          }
        } catch (error) {
          console.error('❌ Error fetching user profile:', error);
        }
      } else {
        console.log('🚫 No user authenticated - showing login screen');
        setUser(null);
        setUserProfile(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signUp = async (email, password, additionalData = {}) => {
    try {
      console.log('\n📝 SIGNUP STARTED');
      console.log('   Email:', email);

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log('   ✅ Firebase Auth user created');

      // Create user profile in Firestore
      const userProfile = {
        email,
        createdAt: new Date().toISOString(),
        onboardingComplete: false,
        ...additionalData
      };

      await setDoc(doc(db, 'users', userCredential.user.uid), userProfile);
      console.log('   ✅ User profile saved to Firestore');
      setUserProfile(userProfile);

      console.log('✅ SIGNUP COMPLETE - UID:', userCredential.user.uid, '\n');
      return { success: true, user: userCredential.user };
    } catch (error) {
      console.error('❌ SIGNUP FAILED:', error.message, '\n');
      return { success: false, error: error.message };
    }
  };

  const signIn = async (email, password) => {
    try {
      console.log('\n🔓 LOGIN STARTED');
      console.log('   Email:', email);

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('   ✅ Authentication successful');

      // Fetch user profile
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      if (userDoc.exists()) {
        setUserProfile(userDoc.data());
        console.log('   ✅ User profile loaded from Firestore');
      }

      console.log('✅ LOGIN COMPLETE - UID:', userCredential.user.uid, '\n');
      return { success: true, user: userCredential.user };
    } catch (error) {
      console.error('❌ LOGIN FAILED:', error.message, '\n');
      return { success: false, error: error.message };
    }
  };

  const signOut = async () => {
    try {
      console.log('\n🚪 LOGOUT STARTED');
      await firebaseSignOut(auth);
      setUser(null);
      setUserProfile(null);
      console.log('✅ LOGOUT COMPLETE\n');
      return { success: true };
    } catch (error) {
      console.error('❌ LOGOUT FAILED:', error.message, '\n');
      return { success: false, error: error.message };
    }
  };

  const updateUserProfile = async (updates) => {
    if (!user) {
      return { success: false, error: 'No user logged in' };
    }

    try {
      await setDoc(doc(db, 'users', user.uid), updates, { merge: true });
      setUserProfile(prev => ({ ...prev, ...updates }));
      return { success: true };
    } catch (error) {
      console.error('Update profile error:', error);
      return { success: false, error: error.message };
    }
  };

  const value = {
    user,
    userProfile,
    loading,
    signUp,
    signIn,
    signOut,
    updateUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
