export interface Link {
  id: string;
  title: string;
  url: string;
  description: string;
  collectionId: string | null;
  tags: string[];
  createdAt: number;
  updatedAt: number;
}
