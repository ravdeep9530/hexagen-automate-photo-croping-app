import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import type {
  CropMetaData,
  ProcessedPhoto,
  UploadedImage,
  ValidationFailure,
} from './entities'

describe('entity type contracts', () => {
  it('allows UploadedImage fields from the data model', () => {
    const uploadedImage: UploadedImage = {
      id: 'uuid-123',
      filename: 'portrait.jpg',
      uploaded_at: '2026-01-01T10:00:00Z',
      user_id: null,
      status: 'uploaded',
    }

    assert.equal(uploadedImage.status, 'uploaded')
  })

  it('requires CropMetaData numeric coordinates and dimensions', () => {
    const crop: CropMetaData = {
      x: 10,
      y: 20,
      width: 300,
      height: 400,
    }

    assert.equal(crop.width, 300)
  })

  it('allows ValidationFailure type and detail strings', () => {
    const failure: ValidationFailure = {
      type: 'file_too_small',
      detail: 'The uploaded image is smaller than the minimum supported size.',
    }

    assert.equal(failure.type, 'file_too_small')
  })

  it('allows ProcessedPhoto API response shape', () => {
    const processedPhoto: ProcessedPhoto = {
      id: 'processed-123',
      original_image_id: 'uuid-123',
      filename: 'portrait-cropped.jpg',
      processed_at: '2026-01-01T10:05:00Z',
      crop_metadata: {
        x: 0,
        y: 0,
        width: 512,
        height: 512,
      },
      status: 'processed',
      validation_failures: [],
    }

    assert.equal(processedPhoto.crop_metadata.height, 512)
  })
})
