import { create } from 'zustand';
import { Link } from '../models/link';

interface LinksState {
  links: Link[];
  isLoading: boolean;
  setLinks: (links: Link[]) => void;
  setLoading: (loading: boolean) => void;
}

export const useLinksStore = create<LinksState>((set) => ({
  links: [],
  isLoading: false,
  setLinks: (links) => set({ links }),
  setLoading: (isLoading) => set({ isLoading }),
}));
