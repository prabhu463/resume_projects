/**
 * Auth Context for TaskRabbit Lite
 * Secure user authentication state management
 */
import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';
import firestore from '@react-native-firebase/firestore';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Subscribe to auth state changes
    const unsubscribeAuth = authService.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        
        // Fetch user profile from Firestore
        const unsubscribeProfile = firestore()
          .collection('users')
          .doc(firebaseUser.uid)
          .onSnapshot((doc) => {
            if (doc.exists) {
              setUserProfile({ id: doc.id, ...doc.data() });
            }
          });

        setLoading(false);
        return () => unsubscribeProfile();
      } else {
        setUser(null);
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const login = async (email, password) => {
    const firebaseUser = await authService.login(email, password);
    return firebaseUser;
  };

  const register = async (email, password, userData) => {
    const firebaseUser = await authService.register(email, password, userData);
    return firebaseUser;
  };

  const logout = async () => {
    await authService.logout();
  };

  const updateProfile = async (data) => {
    if (!user) return;
    
    await firestore()
      .collection('users')
      .doc(user.uid)
      .update({
        ...data,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });
  };

  const value = {
    user,
    userProfile,
    loading,
    login,
    register,
    logout,
    updateProfile,
    isAuthenticated: !!user,
    isProvider: userProfile?.role === 'provider',
    isCustomer: userProfile?.role === 'customer',
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
