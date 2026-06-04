import { afterEach, describe, expect, it, vi } from 'vitest';

const getPhotoGuidelinesMock = vi.fn();

vi.mock('../../../src/lib/guidelines', () => ({
  getPhotoGuidelines: getPhotoGuidelinesMock,
}));

afterEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
});

describe('GET /api/photoGuidelines', () => {
  it('returns requirements and visuals from the guidelines provider', async () => {
    getPhotoGuidelinesMock.mockReturnValue({
      requirements: [
        {
          id: 'plain-background',
          label: 'Plain background',
          description: 'Use a plain light-colored background with no visible patterns or objects.',
        },
      ],
      visuals: [
        {
          id: 'good-example',
          label: 'Approved example',
          assetUrl: 'https://assets.example.com/passport-guidelines/good-example.svg',
          altText: 'Example of a passport photo with centered face and plain background',
        },
      ],
    });

    const { GET } = await import('../../../src/app/api/photoGuidelines/route');
    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      requirements: [
        {
          id: 'plain-background',
          label: 'Plain background',
          description: 'Use a plain light-colored background with no visible patterns or objects.',
        },
      ],
      visuals: [
        {
          id: 'good-example',
          label: 'Approved example',
          assetUrl: 'https://assets.example.com/passport-guidelines/good-example.svg',
          altText: 'Example of a passport photo with centered face and plain background',
        },
      ],
    });
  });

  it('returns 500 when the guidelines provider throws', async () => {
    getPhotoGuidelinesMock.mockImplementation(() => {
      throw new Error('boom');
    });

    const { GET } = await import('../../../src/app/api/photoGuidelines/route');
    const response = await GET();

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      message: 'Failed to load photo guidelines',
    });
  });
});
