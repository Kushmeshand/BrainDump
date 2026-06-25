import { collection, query, orderBy, onSnapshot, updateDoc, deleteDoc, doc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { useImagesStore } from '../store/imagesStore';
import { ImageItem } from '../models/image';

const IMAGES_PATH = 'images';

export const subscribeToImages = () => {
  const imagesRef = collection(db, IMAGES_PATH);
  // Sort by createdAt descending
  const q = query(imagesRef, orderBy('createdAt', 'desc'));

  useImagesStore.getState().setLoading(true);

  // Fallback if offline
  const fallbackTimeout = setTimeout(() => {
    useImagesStore.getState().setLoading(false);
  }, 2000);

  return onSnapshot(q, (snapshot) => {
    clearTimeout(fallbackTimeout);
    const imagesList: ImageItem[] = [];
    
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const createdAt = data.createdAt?.toMillis ? data.createdAt.toMillis() : (typeof data.createdAt === 'number' ? data.createdAt : Date.now());
      const updatedAt = data.updatedAt?.toMillis ? data.updatedAt.toMillis() : (typeof data.updatedAt === 'number' ? data.updatedAt : Date.now());
      imagesList.push({ 
        id: docSnap.id, 
        ...data,
        tags: data.tags || [],
        favorite: data.favorite || false,
        createdAt,
        updatedAt
      } as ImageItem);
    });

    useImagesStore.getState().setImages(imagesList);
    useImagesStore.getState().setLoading(false);
  }, (error) => {
    console.error('Error fetching images:', error);
    useImagesStore.getState().setLoading(false);
  });
};

export const createImage = async (
  uri: string,
  title: string,
  description: string,
  collectionId: string | null = null,
  tags: string[] = [],
  favorite: boolean = false,
  onProgress?: (progress: number) => void
): Promise<string> => {
  const imagesRef = collection(db, IMAGES_PATH);
  const newDocRef = doc(imagesRef);
  const id = newDocRef.id;

  const formData = new FormData();
  formData.append('file', {
    uri,
    type: 'image/jpeg',
    name: 'upload.jpg',
  } as any);
  formData.append('upload_preset', 'BrainDump');

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

    xhr.onload = async () => {
      if (xhr.status === 200) {
        try {
          const response = JSON.parse(xhr.responseText);
          const now = Date.now();
          
          const newImage: Omit<ImageItem, 'id'> = {
            type: 'image',
            title,
            description,
            imageUrl: response.secure_url,
            public_id: response.public_id,
            width: response.width,
            height: response.height,
            format: response.format,
            bytes: response.bytes,
            collectionId,
            tags,
            favorite,
            createdAt: now,
            updatedAt: now,
          };

          // Save metadata to Firestore
          await setDoc(newDocRef, newImage);
          resolve(id);
        } catch (error) {
          console.error('Error saving image metadata:', error);
          reject(error);
        }
      } else {
        const errorMsg = 'Cloudinary upload failed: ' + xhr.responseText;
        console.error(errorMsg);
        reject(new Error(errorMsg));
      }
    };

    xhr.onerror = () => {
      console.error('Network error during upload');
      reject(new Error('Network error during upload'));
    };

    xhr.send(formData);
  });
};

export const updateImage = async (
  id: string, 
  title: string, 
  description: string, 
  collectionId: string | null = null,
  tags: string[] = [],
  favorite: boolean = false
) => {
  const store = useImagesStore.getState();
  store.setImages(
    store.images.map(img => img.id === id ? { ...img, title, description, collectionId, tags, favorite, updatedAt: Date.now() } : img)
  );

  const imageRef = doc(db, IMAGES_PATH, id);
  await updateDoc(imageRef, {
    title,
    description,
    collectionId,
    tags,
    favorite,
    updatedAt: Date.now(),
  });
};

export const deleteImage = async (id: string) => {
  const store = useImagesStore.getState();
  
  // Optimistically remove from store
  store.setImages(store.images.filter(img => img.id !== id));

  try {
    // Delete from Firestore only (Cloudinary deletion handled securely later via backend)
    const imageRef = doc(db, IMAGES_PATH, id);
    await deleteDoc(imageRef);
  } catch (error) {
    console.error('Error deleting image:', error);
    // You could rollback the optimistic update here if desired
  }
};
