export interface CroppedImage {
  croppedImageId: string;
  imageId: string;
  sessionId?: string;
  storageUrl: string;
  width: number;
  height: number;
  format: string;
  fileSizeBytes: number;
  complianceStatus: 'pending' | 'compliant' | 'non_compliant';
  createdAt: string;
}
