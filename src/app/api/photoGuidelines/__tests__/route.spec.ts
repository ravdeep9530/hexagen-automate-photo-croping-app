import { describe, expect, it, vi } from 'vitest';

vi.mock('../../../../lib/photo-guidelines', () => ({
  getPhotoGuidelines: vi.fn(),
}));

import { getPhotoGuidelines } from '../../../../lib/photo-guidelines';
import { handleGetPhotoGuidelines } from '../route';

describe('GET /api/photoGuidelines', () => {
  it('returns requirements and visuals on success', async () => {
    vi.mocked(getPhotoGuidelines).mockReturnValue({
      requirements: [
        {
          id: 'size',
          label: 'Photo size',
          value: '2 x 2 inches (51 x 51 mm)',
        },
      ],
      visuals: [
        {
          id: 'good-example',
          title: 'Acceptable passport photo example',
          imageUrl: 'https://assets.example.com/passport/good-example.png',
          altText: 'Example of a compliant passport photo with centered face and plain background',
        },
      ],
    });

    const response = await handleGetPhotoGuidelines();

    expect(response).toEqual({
      status: 200,
      body: {
        requirements: [
          {
            id: 'size',
            label: 'Photo size',
            value: '2 x 2 inches (51 x 51 mm)',
          },
        ],
        visuals: [
          {
            id: 'good-example',
            title: 'Acceptable passport photo example',
            imageUrl: 'https://assets.example.com/passport/good-example.png',
            altText: 'Example of a compliant passport photo with centered face and plain background',
          },
        ],
      },
    });
  });

  it('returns 500 when the provider throws', async () => {
    vi.mocked(getPhotoGuidelines).mockImplementation(() => {
      throw new Error('boom');
    });

    const response = await handleGetPhotoGuidelines();

    expect(response).toEqual({
      status: 500,
      body: {
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Internal server error',
          details: null,
        },
      },
    });
  });
});
