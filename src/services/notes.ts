import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { useNotesStore } from '../store/notesStore';
import { Note } from '../models/note';

const NOTES_PATH = 'notes';

export const subscribeToNotes = () => {
  const notesRef = collection(db, NOTES_PATH);
  // Sort by createdAt descending
  const q = query(notesRef, orderBy('createdAt', 'desc'));

  useNotesStore.getState().setLoading(true);

  // Fallback if offline
  const fallbackTimeout = setTimeout(() => {
    useNotesStore.getState().setLoading(false);
  }, 2000);

  return onSnapshot(q, (snapshot) => {
    clearTimeout(fallbackTimeout);
    const notesList: Note[] = [];
    
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const createdAt = data.createdAt?.toMillis ? data.createdAt.toMillis() : (typeof data.createdAt === 'number' ? data.createdAt : Date.now());
      const updatedAt = data.updatedAt?.toMillis ? data.updatedAt.toMillis() : (typeof data.updatedAt === 'number' ? data.updatedAt : Date.now());
      notesList.push({ 
        id: docSnap.id, 
        ...data,
        createdAt,
        updatedAt
      } as Note);
    });

    useNotesStore.getState().setNotes(notesList);
    useNotesStore.getState().setLoading(false);
  }, (error) => {
    console.error('Error fetching notes:', error);
    useNotesStore.getState().setLoading(false);
  });
};

export const createNote = async (title: string, content: string, collectionId: string | null = null) => {
  const notesRef = collection(db, NOTES_PATH);
  const newDocRef = doc(notesRef); // Generate ID instantly locally

  const now = Date.now();
  const newNote = {
    title,
    content,
    collectionId,
    createdAt: now,
    updatedAt: now,
  };

  // Optimistically update the store immediately with the REAL ID
  const store = useNotesStore.getState();
  store.setNotes([{ id: newDocRef.id, ...newNote } as Note, ...store.notes]);

  // Save to Firestore
  try {
    await setDoc(newDocRef, newNote);
  } catch (error) {
    console.error('Error saving note to Firestore:', error);
  }

  return newDocRef.id;
};

export const updateNote = async (id: string, title: string, content: string, collectionId: string | null = null) => {
  const store = useNotesStore.getState();
  store.setNotes(
    store.notes.map(n => n.id === id ? { ...n, title, content, collectionId, updatedAt: Date.now() } : n)
  );

  const noteRef = doc(db, NOTES_PATH, id);
  await updateDoc(noteRef, {
    title,
    content,
    collectionId,
    updatedAt: Date.now(),
  });
};

export const deleteNote = async (id: string) => {
  const store = useNotesStore.getState();
  store.setNotes(store.notes.filter(n => n.id !== id));

  const noteRef = doc(db, NOTES_PATH, id);
  await deleteDoc(noteRef);
};
