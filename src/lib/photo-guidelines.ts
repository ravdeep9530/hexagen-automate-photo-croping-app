export interface PhotoGuidelineRequirement {
  id: string;
  label: string;
  value: string;
}

export interface PhotoGuidelineVisual {
  id: string;
  title: string;
  imageUrl: string;
  altText: string;
}

export interface PhotoGuidelinesPayload {
  requirements: PhotoGuidelineRequirement[];
  visuals: PhotoGuidelineVisual[];
}

const REQUIREMENTS: PhotoGuidelineRequirement[] = [
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
];

const VISUALS: PhotoGuidelineVisual[] = [
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
];

export function getPhotoGuidelines(): PhotoGuidelinesPayload {
  return {
    requirements: REQUIREMENTS.map((requirement) => ({ ...requirement })),
    visuals: VISUALS.map((visual) => ({ ...visual })),
  };
}
