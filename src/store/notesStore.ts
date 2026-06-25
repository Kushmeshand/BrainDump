import { create } from 'zustand';
import { Note } from '../models/note';

interface NotesState {
  notes: Note[];
  isLoading: boolean;
  setNotes: (notes: Note[]) => void;
  setLoading: (loading: boolean) => void;
}

export const useNotesStore = create<NotesState>((set) => ({
  notes: [],
  isLoading: false,
  setNotes: (notes) => set({ notes }),
  setLoading: (isLoading) => set({ isLoading }),
}));
