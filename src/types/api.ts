import type { CropParameters } from './crop-parameters';
import type { CroppedImage } from './cropped-image';
import type { UserPhotoSession } from './session';
import type { UploadedImage } from './uploaded-image';

export type CreatePhotoSessionRequest = {
  userId?: string | null;
};

export type CreatePhotoSessionResponse = {
  session: UserPhotoSession;
};

export type GetPhotoSessionResponse = {
  session: UserPhotoSession;
  image: UploadedImage | null;
  croppedImage: CroppedImage | null;
};

export type PhotoStatusResponse = {
  sessionId: string;
  hasUploaded: boolean;
  hasCropped: boolean;
  uploadedPhotoUrl: string | null;
  croppedPhotoUrl: string | null;
  complianceStatus: 'missing_upload' | 'uploaded' | 'cropped';
};

export type UploadImageRequest = {
  sessionId: string;
  filename: string;
  mimetype: string;
};

export type UploadImageResponse = {
  image: UploadedImage;
};

export type CropImageRequest = CropParameters;

export type CropImageResponse = {
  croppedImage: CroppedImage;
};

export type ApiErrorResponse = {
  message: string;
};
