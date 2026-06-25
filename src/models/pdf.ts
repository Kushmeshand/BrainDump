export interface PdfItem {
  id: string;
  type: 'pdf';
  title: string;
  description: string;
  pdfUrl: string;
  publicId: string;
  fileName: string;
  fileSize: number;
  pageCount?: number;
  collectionId: string | null;
  favorite: boolean;
  tags: string[];
  createdAt: number;
  updatedAt: number;
}
