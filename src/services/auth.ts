import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  onAuthStateChanged,
  updateProfile as updateFirebaseAuthProfile,
  signInAnonymously,
  signOut
} from 'firebase/auth';
import { auth } from './firebase';
import { useAuthStore, UserProfile as AuthUserProfile } from '../store/authStore';
import { useProfileStore } from '../store/profileStore';
import { getProfile, createProfile } from './profile';

export const subscribeToAuthChanges = () => {
  return onAuthStateChanged(auth, async (firebaseUser) => {
    const authStore = useAuthStore.getState();
    const profileStore = useProfileStore.getState();

    if (firebaseUser) {
      // Basic auth user object
      const user: AuthUserProfile = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
      };
      authStore.setUser(user);

      // Fetch or create extended Profile
      profileStore.setLoading(true);
      let profile = await getProfile(firebaseUser.uid);
      
      if (!profile) {
        // Automatically create profile for new user / existing user missing profile
        profile = await createProfile(
          firebaseUser.uid,
          firebaseUser.email,
          firebaseUser.displayName
        );
      }
      
      profileStore.setProfile(profile);
      profileStore.setLoading(false);
    } else {
      // Auto-login anonymously to preserve app functionality without a login screen
      try {
        await signInAnonymously(auth);
      } catch (err) {
        console.warn('Anonymous login failed (likely disabled in Firebase Console). Falling back to mock Guest user for testing.', err);
        
        // Mock user fallback so Profile UI can still be tested
        const mockUid = 'mock-guest-uid-123';
        authStore.setUser({ uid: mockUid, email: 'guest@braindump.app', displayName: 'Guest User' });
        
        profileStore.setProfile({
          uid: mockUid,
          displayName: 'Guest User',
          email: 'guest@braindump.app',
          photoURL: null,
          college: 'BrainDump University',
          branch: 'Guest Mode',
          semester: '1st',
          bio: 'This is a local guest profile because anonymous auth is disabled in Firebase.',
          createdAt: Date.now(),
          updatedAt: Date.now()
        });
      }
    }
    
    authStore.setLoading(false);
  });
};

export const signUp = async (email: string, password: string, name: string) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;
  
  // Update display name in Firebase Auth
  await updateFirebaseAuthProfile(user, { displayName: name });
  
  // Create profile in Firestore
  await createProfile(user.uid, user.email, name);
  
  return user;
};

export const login = async (email: string, password: string) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
};

export const logout = async () => {
  await signOut(auth);
};
