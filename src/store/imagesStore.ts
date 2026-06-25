import { create } from 'zustand';
import { ImageItem } from '../models/image';

interface ImagesState {
  images: ImageItem[];
  isLoading: boolean;
  setImages: (images: ImageItem[]) => void;
  setLoading: (loading: boolean) => void;
}

export const useImagesStore = create<ImagesState>((set) => ({
  images: [],
  isLoading: true,
  setImages: (images) => set({ images }),
  setLoading: (isLoading) => set({ isLoading }),
}));
