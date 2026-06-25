import { create } from 'zustand';
import { Collection } from '../models/collection';

interface CollectionsState {
  collections: Collection[];
  isLoading: boolean;
  setCollections: (collections: Collection[]) => void;
  setLoading: (isLoading: boolean) => void;
}

export const useCollectionsStore = create<CollectionsState>((set) => ({
  collections: [],
  isLoading: true,
  setCollections: (collections) => set({ collections }),
  setLoading: (isLoading) => set({ isLoading }),
}));
