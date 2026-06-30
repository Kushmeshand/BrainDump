import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import { UserProfile } from '../models/profile';
import { useProfileStore } from '../store/profileStore';

const PROFILES_COLLECTION = 'users';

export const getProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    const docRef = doc(db, PROFILES_COLLECTION, uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as UserProfile;
    }
    return null;
  } catch (error) {
    console.error('Error fetching profile:', error);
    return null;
  }
};

export const createProfile = async (
  uid: string, 
  email: string | null, 
  displayName: string | null
): Promise<UserProfile | null> => {
  try {
    const now = Date.now();
    const newProfile: UserProfile = {
      uid,
      email,
      displayName,
      photoURL: null,
      college: '',
      branch: '',
      semester: '',
      bio: '',
      createdAt: now,
      updatedAt: now,
    };
    
    const docRef = doc(db, PROFILES_COLLECTION, uid);
    await setDoc(docRef, newProfile);
    return newProfile;
  } catch (error) {
    console.error('Error creating profile:', error);
    return null;
  }
};

export const updateProfile = async (uid: string, data: Partial<UserProfile>): Promise<void> => {
  try {
    const docRef = doc(db, PROFILES_COLLECTION, uid);
    await updateDoc(docRef, {
      ...data,
      updatedAt: Date.now()
    });
    
    // Update local store
    const store = useProfileStore.getState();
    if (store.profile && store.profile.uid === uid) {
      store.setProfile({ ...store.profile, ...data, updatedAt: Date.now() });
    }
  } catch (error) {
    console.error('Error updating profile:', error);
    throw error;
  }
};

export const uploadProfilePicture = async (uri: string, onProgress?: (progress: number) => void): Promise<string> => {
  const formData = new FormData();
  formData.append('file', {
    uri,
    type: 'image/jpeg',
    name: 'profile.jpg',
  } as any);
  formData.append('upload_preset', 'BrainDump'); // Reusing existing preset

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', 'https://api.cloudinary.com/v1_1/dtymwiwmj/image/upload');
    
    if (onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = (event.loaded / event.total) * 100;
          onProgress(progress);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status === 200) {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve(response.secure_url);
        } catch (error) {
          reject(error);
        }
      } else {
        reject(new Error('Cloudinary upload failed'));
      }
    };

    xhr.onerror = () => reject(new Error('Network error during upload'));
    xhr.send(formData);
  });
};
