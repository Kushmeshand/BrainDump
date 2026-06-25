import { collection, query, orderBy, onSnapshot, updateDoc, deleteDoc, doc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { useLinksStore } from '../store/linksStore';
import { Link } from '../models/link';

const LINKS_PATH = 'links';

export const subscribeToLinks = () => {
  const linksRef = collection(db, LINKS_PATH);
  const q = query(linksRef, orderBy('createdAt', 'desc'));

  useLinksStore.getState().setLoading(true);

  const fallbackTimeout = setTimeout(() => {
    useLinksStore.getState().setLoading(false);
  }, 2000);

  return onSnapshot(q, (snapshot) => {
    clearTimeout(fallbackTimeout);
    const linksList: Link[] = [];
    
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const createdAt = data.createdAt?.toMillis ? data.createdAt.toMillis() : (typeof data.createdAt === 'number' ? data.createdAt : Date.now());
      const updatedAt = data.updatedAt?.toMillis ? data.updatedAt.toMillis() : (typeof data.updatedAt === 'number' ? data.updatedAt : Date.now());
      linksList.push({ 
        id: docSnap.id, 
        ...data,
        createdAt,
        updatedAt
      } as Link);
    });

    useLinksStore.getState().setLinks(linksList);
    useLinksStore.getState().setLoading(false);
  }, (error) => {
    console.error('Error fetching links:', error);
    useLinksStore.getState().setLoading(false);
  });
};

export const createLink = async (title: string, url: string, description: string, tags: string[], collectionId: string | null = null) => {
  const linksRef = collection(db, LINKS_PATH);
  const newDocRef = doc(linksRef);

  const now = Date.now();
  const newLink = {
    title,
    url,
    description,
    tags,
    collectionId,
    createdAt: now,
    updatedAt: now,
  };

  const store = useLinksStore.getState();
  store.setLinks([{ id: newDocRef.id, ...newLink } as Link, ...store.links]);

  // Save to Firestore
  try {
    await setDoc(newDocRef, newLink);
  } catch (error) {
    console.error('Error saving link to Firestore:', error);
  }

  return newDocRef.id;
};

export const updateLink = async (id: string, title: string, url: string, description: string, tags: string[], collectionId: string | null = null) => {
  const store = useLinksStore.getState();
  store.setLinks(
    store.links.map(l => l.id === id ? { ...l, title, url, description, tags, collectionId, updatedAt: Date.now() } : l)
  );

  const linkRef = doc(db, LINKS_PATH, id);
  await updateDoc(linkRef, {
    title,
    url,
    description,
    tags,
    collectionId,
    updatedAt: Date.now(),
  });
};

export const deleteLink = async (id: string) => {
  const store = useLinksStore.getState();
  store.setLinks(store.links.filter(l => l.id !== id));

  const linkRef = doc(db, LINKS_PATH, id);
  await deleteDoc(linkRef);
};
