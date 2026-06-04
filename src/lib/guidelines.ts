export type PassportPhotoRequirement = {
  id: string;
  label: string;
  description: string;
};

export type PassportPhotoVisual = {
  id: string;
  label: string;
  assetUrl: string;
  altText: string;
};

export type PhotoGuidelinesData = {
  requirements: PassportPhotoRequirement[];
  visuals: PassportPhotoVisual[];
};

const REQUIREMENTS: PassportPhotoRequirement[] = [
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
];

const VISUALS: PassportPhotoVisual[] = [
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
];

export function getPhotoGuidelines(): PhotoGuidelinesData {
  return {
    requirements: REQUIREMENTS.map((requirement) => ({ ...requirement })),
    visuals: VISUALS.map((visual) => ({ ...visual })),
  };
}
