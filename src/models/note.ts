export interface Note {
  id: string;
  title: string;
  content: string;
  collectionId: string | null;
  tags: string[];
  favorite: boolean;
  createdAt: number;
  updatedAt: number;
}
