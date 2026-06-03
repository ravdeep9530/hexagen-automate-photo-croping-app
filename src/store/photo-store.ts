import { createStore } from "zustand/vanilla";
import type { StoreApi } from "zustand/vanilla";

import type {
  CropMetaData,
  ProcessedPhoto,
  UploadedImage,
  ValidationFailure,
} from "../types/entities";

export interface PhotoStoreState {
  images: UploadedImage[];
  crops: CropMetaData[];
  validations: ValidationFailure[];
  processedPhotos: ProcessedPhoto[];
}

export interface PhotoStoreActions {
  addImage: (image: UploadedImage) => void;
  updateCrop: (imageId: UploadedImage["id"], crop: CropMetaData) => void;
  addValidationFailure: (failure: ValidationFailure) => void;
  clearValidationFailures: () => void;
  addProcessedPhoto: (photo: ProcessedPhoto) => void;
}

export type PhotoStore = PhotoStoreState & PhotoStoreActions;

function createInitialPhotoStoreState(): PhotoStoreState {
  return {
    images: [],
    crops: [],
    validations: [],
    processedPhotos: [],
  };
}

function replaceAtIndex<T>(items: T[], index: number, nextItem: T): T[] {
  return items.map((item, itemIndex) => {
    if (itemIndex === index) {
      return nextItem;
    }

    return item;
  });
}

export function createPhotoStore(): StoreApi<PhotoStore> {
  const cropIndexes = new Map<UploadedImage["id"], number>();

  return createStore<PhotoStore>()((set) => ({
    ...createInitialPhotoStoreState(),
    addImage: (image) =>
      set((state) => ({
        images: [...state.images, image],
      })),
    updateCrop: (imageId, crop) =>
      set((state) => {
        if (!state.images.some((image) => image.id === imageId)) {
          return {};
        }

        const existingIndex = cropIndexes.get(imageId);

        if (existingIndex === undefined) {
          cropIndexes.set(imageId, state.crops.length);

          return {
            crops: [...state.crops, crop],
          };
        }

        return {
          crops: replaceAtIndex(state.crops, existingIndex, crop),
        };
      }),
    addValidationFailure: (failure) =>
      set((state) => ({
        validations: [...state.validations, failure],
      })),
    clearValidationFailures: () =>
      set(() => ({
        validations: [],
      })),
    addProcessedPhoto: (photo) =>
      set((state) => ({
        processedPhotos: [...state.processedPhotos, photo],
      })),
  }));
}

export const photoStore = createPhotoStore();
