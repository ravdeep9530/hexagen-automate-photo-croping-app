import type {
  CropMetaData,
  ProcessedPhoto,
  UploadedImage,
  ValidationFailure,
} from "../types/entities";

type PhotoStoreListener = (state: PhotoStoreState) => void;
type PhotoStoreUpdater =
  | Partial<PhotoStoreState>
  | ((state: PhotoStoreState) => Partial<PhotoStoreState>);

export interface PhotoStoreState {
  images: UploadedImage[];
  crops: CropMetaData[];
  validations: ValidationFailure[];
  processedPhotos: ProcessedPhoto[];
  addImage: (image: UploadedImage) => void;
  updateCrop: (crop: CropMetaData) => void;
  addValidationFailure: (failure: ValidationFailure) => void;
  addProcessedPhoto: (photo: ProcessedPhoto) => void;
}

export interface PhotoStore {
  getState: () => PhotoStoreState;
  setState: (updater: PhotoStoreUpdater) => void;
  subscribe: (listener: PhotoStoreListener) => () => void;
}

const createStore = (
  initializer: (
    setState: PhotoStore["setState"],
    getState: PhotoStore["getState"],
  ) => PhotoStoreState,
): PhotoStore => {
  const listeners = new Set<PhotoStoreListener>();
  let state = {} as PhotoStoreState;

  const getState: PhotoStore["getState"] = () => state;

  const setState: PhotoStore["setState"] = (updater) => {
    const nextState = typeof updater === "function" ? updater(state) : updater;
    state = { ...state, ...nextState };
    listeners.forEach((listener) => listener(state));
  };

  state = initializer(setState, getState);

  return {
    getState,
    setState,
    subscribe: (listener) => {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    },
  };
};

export const createPhotoStore = () =>
  createStore((setState) => ({
    images: [],
    crops: [],
    validations: [],
    processedPhotos: [],
    addImage: (image) => {
      setState((state) => ({
        images: [...state.images, image],
      }));
    },
    updateCrop: (crop) => {
      setState((state) => {
        const cropIndex = state.crops.findIndex((entry) => entry.imageId === crop.imageId);

        if (cropIndex === -1) {
          return {
            crops: [...state.crops, crop],
          };
        }

        return {
          crops: state.crops.map((entry, index) => (index === cropIndex ? crop : entry)),
        };
      });
    },
    addValidationFailure: (failure) => {
      setState((state) => ({
        validations: [...state.validations, failure],
      }));
    },
    addProcessedPhoto: (photo) => {
      setState((state) => ({
        processedPhotos: [...state.processedPhotos, photo],
      }));
    },
  }));

export const photoStore = createPhotoStore();
