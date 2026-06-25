export interface Link {
  id: string;
  title: string;
  url: string;
  description: string;
  collectionId: string | null;
  tags: string[];
  favorite: boolean;
  createdAt: number;
  updatedAt: number;
}
