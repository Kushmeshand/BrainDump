import { create } from 'zustand';
import { PdfItem } from '../models/pdf';

interface PdfsState {
  pdfs: PdfItem[];
  isLoading: boolean;
  setPdfs: (pdfs: PdfItem[]) => void;
  addPdf: (pdf: PdfItem) => void;
  updatePdf: (id: string, updates: Partial<PdfItem>) => void;
  deletePdf: (id: string) => void;
  setLoading: (loading: boolean) => void;
}

export const usePdfsStore = create<PdfsState>((set) => ({
  pdfs: [],
  isLoading: true,
  setPdfs: (pdfs) => set({ pdfs }),
  addPdf: (pdf) => set((state) => ({ pdfs: [pdf, ...state.pdfs] })),
  updatePdf: (id, updates) => set((state) => ({
    pdfs: state.pdfs.map(pdf => pdf.id === id ? { ...pdf, ...updates } : pdf)
  })),
  deletePdf: (id) => set((state) => ({
    pdfs: state.pdfs.filter(pdf => pdf.id !== id)
  })),
  setLoading: (isLoading) => set({ isLoading }),
}));
