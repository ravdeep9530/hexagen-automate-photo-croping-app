export interface UserPhotoSession {
  sessionId: string;
  userId: string | null;
  uploadedPhotoUrl: string | null;
  createdAt?: string;
}
