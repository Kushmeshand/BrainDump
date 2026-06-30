export interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  college: string;
  branch: string;
  semester: string;
  bio: string;
  createdAt: number;
  updatedAt: number;
}
