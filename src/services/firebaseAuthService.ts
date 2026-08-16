import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  signInWithPopup,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';

export interface UserProfileData {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isAnonymous?: boolean;
}

export class FirebaseAuthService {
  /**
   * Register with Email and Password
   */
  static async registerWithEmail(name: string, email: string, pass: string): Promise<User> {
    const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), pass);
    if (name.trim()) {
      await updateProfile(userCredential.user, { displayName: name.trim() });
    }
    return userCredential.user;
  }

  /**
   * Login with Email and Password
   */
  static async loginWithEmail(email: string, pass: string): Promise<User> {
    const userCredential = await signInWithEmailAndPassword(auth, email.trim(), pass);
    return userCredential.user;
  }

  /**
   * Login with Google Popup
   */
  static async loginWithGoogle(): Promise<User> {
    const userCredential = await signInWithPopup(auth, googleProvider);
    return userCredential.user;
  }

  /**
   * Send Password Reset Email
   */
  static async resetPassword(email: string): Promise<void> {
    await sendPasswordResetEmail(auth, email.trim());
  }

  /**
   * Logout current user
   */
  static async logout(): Promise<void> {
    await signOut(auth);
  }

  /**
   * Subscribe to auth changes
   */
  static onAuthStateChange(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, callback);
  }

  /**
   * Get current user
   */
  static getCurrentUser(): User | null {
    return auth.currentUser;
  }
}
