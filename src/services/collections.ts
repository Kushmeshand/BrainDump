import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy,
  serverTimestamp,
  getDocs,
  setDoc
} from 'firebase/firestore';
import { db } from './firebase';
import { Collection, generateCollectionVisuals } from '../models/collection';
import { useCollectionsStore } from '../store/collectionsStore';

const COLLECTIONS_PATH = 'collections';

// We use a global index to cycle through visual styles for new collections
let nextVisualIndex = 0;

export const subscribeToCollections = () => {
  const collectionsRef = collection(db, COLLECTIONS_PATH);
  const q = query(collectionsRef, orderBy('createdAt', 'desc'));

  useCollectionsStore.getState().setLoading(true);

  // If offline, onSnapshot might never fire the first time. Fallback to false after 2 seconds.
  const fallbackTimeout = setTimeout(() => {
    useCollectionsStore.getState().setLoading(false);
  }, 2000);

  return onSnapshot(q, (snapshot) => {
    clearTimeout(fallbackTimeout);
    const collectionsList: Collection[] = [];
    
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      collectionsList.push({
        id: docSnap.id,
        name: data.name,
        createdAt: data.createdAt?.toMillis() || Date.now(),
        count: data.count || 0,
        icon: data.icon,
        colorClass: data.colorClass,
        bgClass: data.bgClass,
      });
    });

    useCollectionsStore.getState().setCollections(collectionsList);
    useCollectionsStore.getState().setLoading(false);
  }, (error) => {
    console.error('Error fetching collections:', error);
    useCollectionsStore.getState().setLoading(false);
  });
};

export const createCollection = async (name: string) => {
  const collectionsRef = collection(db, COLLECTIONS_PATH);
  const newDocRef = doc(collectionsRef); // Generate ID instantly locally
  
  // Try to figure out next visual index by looking at current state size
  const currentCount = useCollectionsStore.getState().collections.length;
  const visual = generateCollectionVisuals(currentCount);

  const newCollection = {
    name,
    createdAt: Date.now(),
    count: 0,
    ...visual
  };

  // Optimistically update the store immediately with the REAL ID
  const store = useCollectionsStore.getState();
  store.setCollections([{ id: newDocRef.id, ...newCollection } as Collection, ...store.collections]);

  // Save to Firestore
  try {
    await setDoc(newDocRef, {
      ...newCollection,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error saving collection to Firestore:', error);
  }

  return newDocRef.id;
};

export const updateCollection = async (id: string, name: string) => {
  const store = useCollectionsStore.getState();
  store.setCollections(
    store.collections.map(c => c.id === id ? { ...c, name } : c)
  );

  const docRef = doc(db, COLLECTIONS_PATH, id);
  await updateDoc(docRef, { name });
};

export const deleteCollection = async (id: string) => {
  const store = useCollectionsStore.getState();
  store.setCollections(store.collections.filter(c => c.id !== id));

  const docRef = doc(db, COLLECTIONS_PATH, id);
  await deleteDoc(docRef);
};
