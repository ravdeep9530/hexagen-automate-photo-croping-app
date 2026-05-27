import { PhotoPreset, PresetCatalog } from '../domain/presets';

const CATALOG_VERSION = '2024.1.0';
const REVIEWED_AT = '2024-06-01T00:00:00.000Z';
const UPDATED_AT = '2024-06-01T00:00:00.000Z';

const ADVISORY_DISCLAIMER =
  'Best-effort static guidance only. Official requirements can change and acceptance is never guaranteed; verify against the linked authority before submitting.';

/**
 * Versioned static catalog of government-photo presets.
 *
 * Dimensions are modeled in millimeters for physical output and include the
 * recommended pixel dimensions at the preset DPI where official or practical
 * export guidance is available.
 */
export const PHOTO_PRESETS: readonly PhotoPreset[] = [
  {
    id: 'ca-passport-50x70',
    name: 'Canada Passport Photo',
    description: 'Canadian passport photo preset: 50 × 70 mm with neutral expression guidance.',
    country: 'CA',
    documentType: 'passport',
    dimensions: { widthMm: 50, heightMm: 70, widthPx: 591, heightPx: 827, minDpi: 300 },
    fileConstraints: {
      maxFileSizeMb: 10,
      acceptedFormats: ['image/jpeg', 'image/png'],
      minResolution: { width: 591, height: 827 },
    },
    facePosition: {
      chinToTopOfHeadMm: { min: 31, max: 36 },
    },
    background: { color: 'white', hexCode: '#FFFFFF', shadowAllowed: false },
    source: {
      country: 'CA',
      authority: 'Government of Canada',
      url: 'https://www.canada.ca/en/immigration-refugees-citizenship/services/canadian-passports/photos.html',
      lastReviewed: REVIEWED_AT,
      documentType: 'passport',
    },
    isActive: true,
    tags: ['passport', 'canada', '50x70mm', 'white-background', ADVISORY_DISCLAIMER],
    createdAt: UPDATED_AT,
    updatedAt: UPDATED_AT,
  },
  {
    id: 'ca-pr-card-50x70',
    name: 'Canada Permanent Resident Card Photo',
    description: 'Canadian permanent resident card photo preset using the common 50 × 70 mm specification.',
    country: 'CA',
    documentType: 'id-card',
    dimensions: { widthMm: 50, heightMm: 70, widthPx: 591, heightPx: 827, minDpi: 300 },
    fileConstraints: {
      maxFileSizeMb: 10,
      acceptedFormats: ['image/jpeg', 'image/png'],
      minResolution: { width: 591, height: 827 },
    },
    facePosition: {
      chinToTopOfHeadMm: { min: 31, max: 36 },
    },
    background: { color: 'white', hexCode: '#FFFFFF', shadowAllowed: false },
    source: {
      country: 'CA',
      authority: 'Immigration, Refugees and Citizenship Canada',
      url: 'https://www.canada.ca/en/immigration-refugees-citizenship/services/application/application-forms-guides/application-permanent-resident-card.html',
      lastReviewed: REVIEWED_AT,
      documentType: 'permanent-resident-card',
    },
    isActive: true,
    tags: ['pr-card', 'permanent-resident', 'canada', '50x70mm', ADVISORY_DISCLAIMER],
    createdAt: UPDATED_AT,
    updatedAt: UPDATED_AT,
  },
  {
    id: 'ca-visa-35x45',
    name: 'Canada Visa Photo',
    description: 'Canadian visa and immigration digital-photo preset: 35 × 45 mm output with plain background guidance.',
    country: 'CA',
    documentType: 'visa',
    dimensions: { widthMm: 35, heightMm: 45, widthPx: 413, heightPx: 531, minDpi: 300 },
    fileConstraints: {
      maxFileSizeMb: 4,
      acceptedFormats: ['image/jpeg', 'image/png'],
      minResolution: { width: 420, height: 540 },
    },
    facePosition: {
      chinToTopOfHeadMm: { min: 31, max: 36 },
    },
    background: { color: 'white', hexCode: '#FFFFFF', shadowAllowed: false },
    source: {
      country: 'CA',
      authority: 'Immigration, Refugees and Citizenship Canada',
      url: 'https://www.canada.ca/en/immigration-refugees-citizenship/services/application/photos.html',
      lastReviewed: REVIEWED_AT,
      documentType: 'visa',
    },
    isActive: true,
    tags: ['visa', 'canada', '35x45mm', 'immigration', ADVISORY_DISCLAIMER],
    createdAt: UPDATED_AT,
    updatedAt: UPDATED_AT,
  },
  {
    id: 'us-passport-2x2',
    name: 'United States Passport Photo',
    description: 'US passport photo preset: 2 × 2 inches, represented as 50.8 × 50.8 mm at 300 DPI.',
    country: 'US',
    documentType: 'passport',
    dimensions: { widthMm: 50.8, heightMm: 50.8, widthPx: 600, heightPx: 600, minDpi: 300 },
    fileConstraints: {
      maxFileSizeMb: 10,
      acceptedFormats: ['image/jpeg', 'image/png'],
      minResolution: { width: 600, height: 600 },
    },
    facePosition: {
      chinToTopOfHeadMm: { min: 25, max: 35 },
      eyeHeightPosition: { min: 0.5, max: 0.69 },
    },
    background: { color: 'white', hexCode: '#FFFFFF', shadowAllowed: false },
    source: {
      country: 'US',
      authority: 'U.S. Department of State',
      url: 'https://travel.state.gov/content/travel/en/passports/how-apply/photos.html',
      lastReviewed: REVIEWED_AT,
      documentType: 'passport',
    },
    isActive: true,
    tags: ['passport', 'united-states', '2x2in', '600x600px', ADVISORY_DISCLAIMER],
    createdAt: UPDATED_AT,
    updatedAt: UPDATED_AT,
  },
  {
    id: 'us-visa-2x2',
    name: 'United States Visa Photo',
    description: 'US visa photo preset aligned with the Department of State 2 × 2 inch digital-photo requirements.',
    country: 'US',
    documentType: 'visa',
    dimensions: { widthMm: 50.8, heightMm: 50.8, widthPx: 600, heightPx: 600, minDpi: 300 },
    fileConstraints: {
      maxFileSizeMb: 10,
      acceptedFormats: ['image/jpeg'],
      minResolution: { width: 600, height: 600 },
    },
    facePosition: {
      chinToTopOfHeadMm: { min: 25, max: 35 },
      eyeHeightPosition: { min: 0.5, max: 0.69 },
    },
    background: { color: 'white', hexCode: '#FFFFFF', shadowAllowed: false },
    source: {
      country: 'US',
      authority: 'U.S. Department of State',
      url: 'https://travel.state.gov/content/travel/en/us-visas/visa-information-resources/photos.html',
      lastReviewed: REVIEWED_AT,
      documentType: 'visa',
    },
    isActive: true,
    tags: ['visa', 'united-states', '2x2in', 'jpeg', ADVISORY_DISCLAIMER],
    createdAt: UPDATED_AT,
    updatedAt: UPDATED_AT,
  },
  {
    id: 'us-dl-2x2',
    name: 'United States Driver License Photo (Generic)',
    description: 'Generic US driver license photo crop preset for state DMV-style headshots; verify state-specific rules.',
    country: 'US',
    documentType: 'driving-license',
    dimensions: { widthMm: 50.8, heightMm: 50.8, widthPx: 600, heightPx: 600, minDpi: 300 },
    fileConstraints: {
      maxFileSizeMb: 10,
      acceptedFormats: ['image/jpeg', 'image/png'],
      minResolution: { width: 600, height: 600 },
    },
    facePosition: {
      eyeHeightPosition: { min: 0.45, max: 0.7 },
    },
    background: { color: 'any', shadowAllowed: false },
    source: {
      country: 'US',
      authority: 'State DMV requirements vary',
      url: 'https://www.usa.gov/state-motor-vehicle-services',
      lastReviewed: REVIEWED_AT,
      documentType: 'driving-license',
    },
    isActive: true,
    tags: ['driver-license', 'united-states', 'generic', 'manual-verification-required', ADVISORY_DISCLAIMER],
    createdAt: UPDATED_AT,
    updatedAt: UPDATED_AT,
  },
  {
    id: 'in-passport-35x45',
    name: 'India Passport Photo',
    description: 'Indian passport photo preset: 35 × 45 mm with close-up face and plain light background guidance.',
    country: 'IN',
    documentType: 'passport',
    dimensions: { widthMm: 35, heightMm: 45, widthPx: 413, heightPx: 531, minDpi: 300 },
    fileConstraints: {
      maxFileSizeMb: 2,
      acceptedFormats: ['image/jpeg', 'image/png'],
      minResolution: { width: 413, height: 531 },
    },
    facePosition: {
      chinToTopOfHeadMm: { min: 25, max: 35 },
      eyeHeightPosition: { min: 0.5, max: 0.75 },
    },
    background: { color: 'white', hexCode: '#FFFFFF', shadowAllowed: false },
    source: {
      country: 'IN',
      authority: 'Passport Seva, Government of India',
      url: 'https://passportindia.gov.in/AppOnlineProject/online/photographGuidelines',
      lastReviewed: REVIEWED_AT,
      documentType: 'passport',
    },
    isActive: true,
    tags: ['passport', 'india', '35x45mm', 'passport-seva', ADVISORY_DISCLAIMER],
    createdAt: UPDATED_AT,
    updatedAt: UPDATED_AT,
  },
  {
    id: 'in-visa-35x45',
    name: 'India Visa Photo',
    description: 'India visa/e-visa photo preset: square digital export with plain light background guidance.',
    country: 'IN',
    documentType: 'visa',
    dimensions: { widthMm: 50.8, heightMm: 50.8, widthPx: 600, heightPx: 600, minDpi: 300 },
    fileConstraints: {
      maxFileSizeMb: 1,
      acceptedFormats: ['image/jpeg'],
      minResolution: { width: 350, height: 350 },
    },
    facePosition: {
      eyeHeightPosition: { min: 0.5, max: 0.75 },
    },
    background: { color: 'white', hexCode: '#FFFFFF', shadowAllowed: false },
    source: {
      country: 'IN',
      authority: 'Indian Visa Online, Government of India',
      url: 'https://indianvisaonline.gov.in/evisa/tvoa.html',
      lastReviewed: REVIEWED_AT,
      documentType: 'visa',
    },
    isActive: true,
    tags: ['visa', 'evisa', 'india', 'square', 'jpeg', ADVISORY_DISCLAIMER],
    createdAt: UPDATED_AT,
    updatedAt: UPDATED_AT,
  },
  {
    id: 'in-oci-35x35',
    name: 'India OCI Photo',
    description: 'Overseas Citizen of India photo preset for online OCI upload: square 35 × 35 mm export guidance.',
    country: 'IN',
    documentType: 'other',
    dimensions: { widthMm: 35, heightMm: 35, widthPx: 413, heightPx: 413, minDpi: 300 },
    fileConstraints: {
      maxFileSizeMb: 1,
      acceptedFormats: ['image/jpeg'],
      minResolution: { width: 360, height: 360 },
    },
    facePosition: {
      eyeHeightPosition: { min: 0.5, max: 0.75 },
    },
    background: { color: 'white', hexCode: '#FFFFFF', shadowAllowed: false },
    source: {
      country: 'IN',
      authority: 'OCI Services, Government of India',
      url: 'https://ociservices.gov.in/',
      lastReviewed: REVIEWED_AT,
      documentType: 'oci',
    },
    isActive: true,
    tags: ['oci', 'india', '35x35mm', 'online-upload', ADVISORY_DISCLAIMER],
    createdAt: UPDATED_AT,
    updatedAt: UPDATED_AT,
  },
  {
    id: 'custom-photo-35x45',
    name: 'Custom 35 × 45 mm Photo',
    description: 'Reusable custom passport/ID photo crop preset for countries that use 35 × 45 mm output.',
    country: 'CUSTOM',
    documentType: 'other',
    dimensions: { widthMm: 35, heightMm: 45, widthPx: 413, heightPx: 531, minDpi: 300 },
    fileConstraints: {
      maxFileSizeMb: 10,
      acceptedFormats: ['image/jpeg', 'image/png', 'image/webp'],
      minResolution: { width: 413, height: 531 },
    },
    facePosition: {
      eyeHeightPosition: { min: 0.45, max: 0.75 },
    },
    background: { color: 'any', shadowAllowed: false },
    source: {
      country: 'CUSTOM',
      authority: 'Hexagen Automate Photo Cropping App',
      url: 'https://example.com/custom-photo-preset-guidance',
      lastReviewed: REVIEWED_AT,
      documentType: 'custom',
    },
    isActive: true,
    tags: ['custom', '35x45mm', 'user-defined', ADVISORY_DISCLAIMER],
    createdAt: UPDATED_AT,
    updatedAt: UPDATED_AT,
  },
] as const;

export const PHOTO_PRESET_CATALOG: PresetCatalog = {
  version: CATALOG_VERSION,
  presets: [...PHOTO_PRESETS],
  lastUpdated: UPDATED_AT,
};
