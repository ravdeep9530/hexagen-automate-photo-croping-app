export interface UploadedImage {
  imageId: string;
  sessionId: string;
  filename: string;
  mimetype: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  storageUrl: string;
  createdAt: string;
}
