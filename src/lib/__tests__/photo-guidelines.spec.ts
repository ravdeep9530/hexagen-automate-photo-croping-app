import { describe, expect, it } from 'vitest';

import { getPhotoGuidelines } from '../photo-guidelines';

describe('getPhotoGuidelines', () => {
  it('returns deterministic requirements and visuals', () => {
    expect(getPhotoGuidelines()).toEqual({
      requirements: [
        {
          id: 'size',
          label: 'Photo size',
          value: '2 x 2 inches (51 x 51 mm)',
        },
        {
          id: 'expression',
          label: 'Expression',
          value: 'Neutral expression with both eyes open',
        },
        {
          id: 'background',
          label: 'Background',
          value: 'Plain white or off-white background',
        },
        {
          id: 'head-size',
          label: 'Head size',
          value: 'Head height should be 1 inch to 1 3/8 inches',
        },
      ],
      visuals: [
        {
          id: 'good-example',
          title: 'Acceptable passport photo example',
          imageUrl: 'https://assets.example.com/passport/good-example.png',
          altText: 'Example of a compliant passport photo with centered face and plain background',
        },
        {
          id: 'bad-lighting',
          title: 'Avoid shadows and poor lighting',
          imageUrl: 'https://assets.example.com/passport/bad-lighting.png',
          altText: 'Example showing harsh shadows and uneven lighting to avoid',
        },
      ],
    });
  });

  it('returns fresh copies of the requirement and visual arrays', () => {
    const first = getPhotoGuidelines();
    const second = getPhotoGuidelines();

    expect(first).not.toBe(second);
    expect(first.requirements).not.toBe(second.requirements);
    expect(first.visuals).not.toBe(second.visuals);
    expect(first.requirements[0]).not.toBe(second.requirements[0]);
    expect(first.visuals[0]).not.toBe(second.visuals[0]);
  });
});
