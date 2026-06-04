import { describe, expect, it } from 'vitest';

import { getPhotoGuidelines } from '../../../src/lib/guidelines';

describe('guidelines provider', () => {
  it('returns deterministic passport requirements and visuals', () => {
    expect(getPhotoGuidelines()).toEqual({
      requirements: [
        {
          id: 'plain-background',
          label: 'Plain background',
          description: 'Use a plain light-colored background with no visible patterns or objects.',
        },
        {
          id: 'forward-facing',
          label: 'Face the camera directly',
          description: 'Keep your head centered, eyes open, and look straight at the camera.',
        },
        {
          id: 'even-lighting',
          label: 'Use even lighting',
          description: 'Avoid shadows on your face or behind you by using balanced lighting.',
        },
        {
          id: 'neutral-expression',
          label: 'Neutral expression',
          description: 'Maintain a neutral expression with your mouth closed and eyes clearly visible.',
        },
      ],
      visuals: [
        {
          id: 'good-example',
          label: 'Approved example',
          assetUrl: 'https://assets.example.com/passport-guidelines/good-example.svg',
          altText: 'Example of a passport photo with centered face and plain background',
        },
        {
          id: 'bad-lighting',
          label: 'Avoid harsh shadows',
          assetUrl: 'https://assets.example.com/passport-guidelines/bad-lighting.svg',
          altText: 'Example showing strong shadows on the face that should be avoided',
        },
      ],
    });
  });

  it('returns fresh copies so consumers cannot mutate shared state', () => {
    const first = getPhotoGuidelines();
    const second = getPhotoGuidelines();

    first.requirements[0].label = 'Mutated';
    first.visuals[0].assetUrl = 'https://mutated.example.com/asset.svg';

    expect(second.requirements[0].label).toBe('Plain background');
    expect(second.visuals[0].assetUrl).toBe('https://assets.example.com/passport-guidelines/good-example.svg');
  });
});
