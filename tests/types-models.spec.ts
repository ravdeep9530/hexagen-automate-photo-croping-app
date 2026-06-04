import { describe, expectTypeOf, it } from 'vitest';

import type {
  ApiErrorResponse,
  CreatePhotoSessionRequest,
  CreatePhotoSessionResponse,
  CropImageRequest,
  CropImageResponse,
  GetPhotoSessionResponse,
  UploadImageRequest,
  UploadImageResponse,
} from '../src/types/api';
import type { CropParameters } from '../src/types/crop-parameters';
import type { CroppedImage } from '../src/types/cropped-image';
import type { UserPhotoSession } from '../src/types/session';
import type { UploadedImage } from '../src/types/uploaded-image';

describe('SDLC-101 type models', () => {
  it('defines the user photo session contract', () => {
    expectTypeOf<UserPhotoSession>().toEqualTypeOf<{
      sessionId: string;
      userId: string | null;
      uploadedPhotoUrl: string | null;
    }>();
  });

  it('defines the uploaded image contract', () => {
    expectTypeOf<UploadedImage>().toEqualTypeOf<{
      imageId: string;
      sessionId: string;
      filename: string;
      mimetype: string;
    }>();
  });

  it('defines the crop parameter contract', () => {
    expectTypeOf<CropParameters>().toEqualTypeOf<{
      imageId: string;
      x: number;
      y: number;
      width: number;
      height: number;
      aspectRatio: number;
    }>();
  });

  it('defines the cropped image contract', () => {
    expectTypeOf<CroppedImage>().toEqualTypeOf<{
      croppedImageId: string;
      imageId: string;
      croppedPhotoUrl: string;
      width: number;
      height: number;
    }>();
  });

  it('defines the API request and response contracts', () => {
    expectTypeOf<CreatePhotoSessionRequest>().toEqualTypeOf<{
      userId?: string | null;
    }>();
    expectTypeOf<CreatePhotoSessionResponse>().toEqualTypeOf<{
      session: UserPhotoSession;
    }>();
    expectTypeOf<GetPhotoSessionResponse>().toEqualTypeOf<{
      session: UserPhotoSession;
      image: UploadedImage | null;
      croppedImage: CroppedImage | null;
    }>();
    expectTypeOf<UploadImageRequest>().toEqualTypeOf<{
      sessionId: string;
      filename: string;
      mimetype: string;
    }>();
    expectTypeOf<UploadImageResponse>().toEqualTypeOf<{
      image: UploadedImage;
    }>();
    expectTypeOf<CropImageRequest>().toEqualTypeOf<CropParameters>();
    expectTypeOf<CropImageResponse>().toEqualTypeOf<{
      croppedImage: CroppedImage;
    }>();
    expectTypeOf<ApiErrorResponse>().toEqualTypeOf<{
      message: string;
    }>();
  });
});
