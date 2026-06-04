export interface CroppedImage {
  croppedImageId: string;
  imageId: string;
  sessionId: string;
  storageUrl: string;
  width: number;
  height: number;
  format: string;
  fileSizeBytes: number;
  createdAt: string;
}
