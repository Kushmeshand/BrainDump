export interface ImageItem {
  id: string;
  type: 'image';
  title: string;
  description: string;
  imageUrl: string;
  public_id: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
  collectionId: string | null;
  favorite: boolean;
  tags: string[];
  createdAt: number;
  updatedAt: number;
}
