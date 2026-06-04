export type CroppedImageComplianceStatus = 'cropped';

export type CroppedImage = {
  croppedImageId: string;
  imageId: string;
  croppedPhotoUrl: string;
  width: number;
  height: number;
  complianceStatus: CroppedImageComplianceStatus;
};
