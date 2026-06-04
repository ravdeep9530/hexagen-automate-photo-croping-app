export type CropParameters = {
  imageId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  aspectRatio: number;
};

export type CropValidationResult = {
  valid: true;
} | {
  valid: false;
  message: string;
};
