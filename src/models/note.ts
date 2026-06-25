export interface Note {
  id: string;
  title: string;
  content: string;
  collectionId: string | null;
  createdAt: number;
  updatedAt: number;
}
