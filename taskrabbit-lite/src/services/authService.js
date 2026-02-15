/**
 * Authentication Service for TaskRabbit Lite
 * Implements secure user authentication with Firebase Auth
 */
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

const usersCollection = firestore().collection('users');

export const authService = {
  /**
   * Register a new user with email and password
   */
  async register(email, password, userData) {
    try {
      // Create auth user
      const userCredential = await auth().createUserWithEmailAndPassword(email, password);
      const { uid } = userCredential.user;

      // Create user document in Firestore
      await usersCollection.doc(uid).set({
        uid,
        email,
        displayName: userData.displayName || '',
        phone: userData.phone || '',
        role: userData.role || 'customer', // 'customer' or 'provider'
        avatar: null,
        location: null,
        rating: 0,
        totalReviews: 0,
        isAvailable: true,
        createdAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });

      return userCredential.user;
    } catch (error) {
      throw this.handleAuthError(error);
    }
  },

  /**
   * Sign in with email and password
   */
  async login(email, password) {
    try {
      const userCredential = await auth().signInWithEmailAndPassword(email, password);
      return userCredential.user;
    } catch (error) {
      throw this.handleAuthError(error);
    }
  },

  /**
   * Sign out current user
   */
  async logout() {
    try {
      await auth().signOut();
    } catch (error) {
      throw this.handleAuthError(error);
    }
  },

  /**
   * Send password reset email
   */
  async resetPassword(email) {
    try {
      await auth().sendPasswordResetEmail(email);
    } catch (error) {
      throw this.handleAuthError(error);
    }
  },

  /**
   * Get current authenticated user
   */
  getCurrentUser() {
    return auth().currentUser;
  },

  /**
   * Subscribe to auth state changes
   */
  onAuthStateChanged(callback) {
    return auth().onAuthStateChanged(callback);
  },

  /**
   * Handle authentication errors
   */
  handleAuthError(error) {
    const errorMessages = {
      'auth/email-already-in-use': 'This email is already registered',
      'auth/invalid-email': 'Invalid email address',
      'auth/weak-password': 'Password should be at least 6 characters',
      'auth/user-not-found': 'No account found with this email',
      'auth/wrong-password': 'Incorrect password',
      'auth/too-many-requests': 'Too many attempts. Please try again later',
    };

    return new Error(errorMessages[error.code] || error.message);
  },
};

export default authService;
