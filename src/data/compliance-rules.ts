import { ComplianceRule, ComplianceRuleset } from '../domain/compliance';

const RULESET_VERSION = '2024.1.0';
const REVIEWED_AT = '2024-06-01T00:00:00.000Z';

/**
 * Reference disclaimer displayed alongside rulesets.
 */
const ADVISORY_NOTE =
  'Compliance rules are advisory guidance based on public government documentation; requirements may change and acceptance is not guaranteed.';

/**
 * Dimension validation rule factory
 */
function createDimensionRule(
  id: string,
  name: string,
  description: string,
  widthMm: number,
  heightMm: number,
  toleranceMm: number,
  overrides?: Partial<ComplianceRule>
): ComplianceRule {
  return {
    id,
    type: 'dimension',
    name,
    description,
    severity: 'error',
    enforcement: 'automatic',
    isActive: true,
    parameters: {
      widthMm,
      heightMm,
      toleranceMm,
      aspectRatio: widthMm / heightMm,
    },
    errorMessage: `Photo dimensions must be ${widthMm} × ${heightMm} mm (±${toleranceMm} mm).`,
    helpText: 'Aspect ratio must be maintained and final output must match required exact dimensions.',
    order: 1,
    ...overrides,
  };
}

/**
 * DPI/resolution validation rule factory
 */
function createResolutionRule(
  id: string,
  minDpi: number,
  minWidthPx: number,
  minHeightPx: number,
  overrides?: Partial<ComplianceRule>
): ComplianceRule {
  return {
    id,
    type: 'resolution',
    name: 'Minimum Resolution',
    description: `Minimum DPI: ${minDpi}; pixel minimums: ${minWidthPx} × ${minHeightPx}.`,
    severity: 'error',
    enforcement: 'automatic',
    isActive: true,
    parameters: { minDpi, minWidthPx, minHeightPx },
    errorMessage: `Resolution must be at least ${minDpi} DPI and meet pixel minimums of ${minWidthPx} × ${minHeightPx}.`,
    helpText: 'Higher resolution is preferred; never upscale beyond original density.',
    order: 2,
    ...overrides,
  };
}

/**
 * Background validation rule factory
 */
function createBackgroundRule(
  id: string,
  allowedColors: string[],
  hexCode?: string,
  overrides?: Partial<ComplianceRule>
): ComplianceRule {
  return {
    id,
    type: 'background',
    name: 'Background Requirements',
    description: `Background must be: ${allowedColors.join(', ')}.`,
    severity: 'error',
    enforcement: 'semi-automatic',
    isActive: true,
    parameters: { allowedColors, preferredHex: hexCode },
    errorMessage: `Background must be a plain ${allowedColors.join(' or ')} color without shadows or textures.`,
    helpText: 'Verify manually in the editor after background removal for subtle artifacts; ensure lighting is diffused and shadow-free.',
    order: 3,
    ...overrides,
  };
}

/**
 * Face position validation rule factory
 */
function createFacePositionRule(
  id: string,
  minChinToTopMm?: number,
  maxChinToTopMm?: number,
  minEyePosition?: number,
  maxEyePosition?: number,
  overrides?: Partial<ComplianceRule>
): ComplianceRule {
  return {
    id,
    type: 'face-position',
    name: 'Face Position',
    description: 'Face must be centered with correct head size ratio.',
    severity: 'error',
    enforcement: 'semi-automatic',
    isActive: true,
    parameters: {
      chinToTopMm: { min: minChinToTopMm, max: maxChinToTopMm },
      eyeHeightPosition: { min: minEyePosition, max: maxEyePosition },
    },
    errorMessage: 'Face must be centered in frame with the top of head and chin within specified bounds.',
    helpText: 'Use the face detection overlay. If alerts appear, adjust crop or capture distance. Manual review is recommended.',
    order: 4,
    ...overrides,
  };
}

/**
 * File type and size validation rule factory
 */
function createFileConstraintsRule(
  id: string,
  maxSizeMb: number,
  acceptedFormats: string[],
  overrides?: Partial<ComplianceRule>
): ComplianceRule {
  return {
    id,
    type: 'file-size',
    name: 'File Constraints',
    description: `Maximum file size: ${maxSizeMb} MB. Accepted formats: ${acceptedFormats.join(', ')}.`,
    severity: 'error',
    enforcement: 'automatic',
    isActive: true,
    parameters: { maxSizeMb, acceptedFormats },
    errorMessage: `File must be ${acceptedFormats.join(' or ')} and smaller than ${maxSizeMb} MB.`,
    helpText: 'Use JPEG for most documents unless transparency is required (PNG).',
    order: 5,
    ...overrides,
  };
}

/**
 * Expression rule (manual checklist)
 */
function createExpressionRule(id: string, overrides?: Partial<ComplianceRule>): ComplianceRule {
  return {
    id,
    type: 'expression',
    name: 'Neutral Expression',
    description: 'Neutral expression: mouth closed, natural relaxed face.',
    severity: 'error',
    enforcement: 'manual',
    isActive: true,
    parameters: {},
    errorMessage: 'Expression must be neutral with mouth closed and eyes clearly visible.',
    helpText: 'Review visually: no smiling with teeth, no frowning, relaxed neutral face.',
    order: 6,
    ...overrides,
  };
}

/**
 * Glasses rule (manual checklist)
 */
function createGlassesRule(id: string, allowed: boolean, overrides?: Partial<ComplianceRule>): ComplianceRule {
  return {
    id,
    type: 'glasses',
    name: 'Eyeglasses',
    description: allowed ? 'Eyeglasses are permitted with restrictions.' : 'Eyeglasses are not permitted.',
    severity: 'warning',
    enforcement: 'manual',
    isActive: true,
    parameters: { allowed, restrictions: allowed ? 'No tint, eyes clearly visible, no glare.' : 'Remove for photo.' },
    errorMessage: allowed
      ? 'Glasses must not obscure eyes and must be free of glare/tint.'
      : 'Remove eyeglasses before capture.',
    helpText: allowed
      ? 'Review capture visually; eyes must be clearly visible without glare.'
      : 'Take photo without glasses.',
    order: 7,
    ...overrides,
  };
}

/**
 * Head covering rule (manual checklist)
 */
function createHeadCoveringRule(id: string, religiousExemption: boolean, overrides?: Partial<ComplianceRule>): ComplianceRule {
  return {
    id,
    type: 'head-covering',
    name: 'Head Coverings',
    description: 'Head coverings are generally prohibited unless for religious reasons.',
    severity: 'warning',
    enforcement: 'manual',
    isActive: true,
    parameters: { religiousExemption, mustNotShadowFace: true },
    errorMessage: 'Remove hats and head coverings unless required for religious purposes; face must be fully visible.',
    helpText: religiousExemption
      ? 'Head covering must not obscure facial features or cast shadows; full face from chin to forehead must show.'
      : 'Remove hats/caps before capture.',
    order: 8,
    ...overrides,
  };
}

/**
 * Lighting quality rule (manual checklist)
 */
function createLightingRule(id: string, overrides?: Partial<ComplianceRule>): ComplianceRule {
  return {
    id,
    type: 'lighting',
    name: 'Lighting Quality',
    description: 'Even, diffused lighting without shadows on face or background.',
    severity: 'warning',
    enforcement: 'manual',
    isActive: true,
    parameters: { shadowsOnFace: false, shadowsOnBackground: false },
    errorMessage: 'Photo must be evenly lit with no harsh shadows.',
    helpText: 'Use soft front lighting. Check for shadows behind head and under chin.',
    order: 9,
    ...overrides,
  };
}

/**
 * Aspect ratio validation rule
 */
function createAspectRatioRule(
  id: string,
  targetRatio: number,
  tolerancePercent: number,
  overrides?: Partial<ComplianceRule>
): ComplianceRule {
  return {
    id,
    type: 'aspect-ratio',
    name: 'Aspect Ratio',
    description: `Aspect ratio must be ${targetRatio.toFixed(4)} (±${tolerancePercent}%).`,
    severity: 'error',
    enforcement: 'automatic',
    isActive: true,
    parameters: { targetRatio, tolerancePercent },
    errorMessage: `Aspect ratio must be ${targetRatio.toFixed(4)} within ${tolerancePercent}% tolerance.`,
    helpText: 'Ensure the crop maintains the target aspect ratio regardless of output size.',
    order: 10,
    ...overrides,
  };
}

/**
 * Format validation rule
 */
function createFormatRule(
  id: string,
  acceptedFormats: string[],
  overrides?: Partial<ComplianceRule>
): ComplianceRule {
  return {
    id,
    type: 'format',
    name: 'File Format',
    description: `Accepted formats: ${acceptedFormats.join(', ')}.`,
    severity: 'error',
    enforcement: 'automatic',
    isActive: true,
    parameters: { acceptedFormats },
    errorMessage: `File must be one of: ${acceptedFormats.join(', ')}.`,
    helpText: 'Convert image to required format before upload if necessary.',
    order: 11,
    ...overrides,
  };
}

// ============================================================================
// Canada Rulesets
// ============================================================================

const CANADA_PASSPORT_RULES: readonly ComplianceRule[] = [
  createDimensionRule('ca-passport-dimension', 'Canada Passport Dimensions', 'Must be 50 × 70 mm.', 50, 70, 0.5),
  createResolutionRule('ca-passport-resolution', 300, 591, 827),
  createBackgroundRule('ca-passport-background', ['white'], '#FFFFFF'),
  createFacePositionRule('ca-passport-face-position', 31, 36),
  createFileConstraintsRule('ca-passport-file', 10, ['image/jpeg', 'image/png']),
  createExpressionRule('ca-passport-expression'),
  createGlassesRule('ca-passport-glasses', true),
  createHeadCoveringRule('ca-passport-head-covering', true),
  createLightingRule('ca-passport-lighting'),
  createAspectRatioRule('ca-passport-aspect', 50 / 70, 1),
  createFormatRule('ca-passport-format', ['image/jpeg', 'image/png']),
];

const CANADA_PR_CARD_RULES: readonly ComplianceRule[] = [
  createDimensionRule('ca-pr-dimension', 'Canada PR Card Dimensions', 'Must be 50 × 70 mm.', 50, 70, 0.5),
  createResolutionRule('ca-pr-resolution', 300, 591, 827),
  createBackgroundRule('ca-pr-background', ['white'], '#FFFFFF'),
  createFacePositionRule('ca-pr-face-position', 31, 36),
  createFileConstraintsRule('ca-pr-file', 10, ['image/jpeg', 'image/png']),
  createExpressionRule('ca-pr-expression'),
  createGlassesRule('ca-pr-glasses', true),
  createHeadCoveringRule('ca-pr-head-covering', true),
  createLightingRule('ca-pr-lighting'),
  createAspectRatioRule('ca-pr-aspect', 50 / 70, 1),
  createFormatRule('ca-pr-format', ['image/jpeg', 'image/png']),
];

const CANADA_VISA_RULES: readonly ComplianceRule[] = [
  createDimensionRule('ca-visa-dimension', 'Canada Visa Dimensions', 'Must be 35 × 45 mm.', 35, 45, 0.5),
  createResolutionRule('ca-visa-resolution', 300, 420, 540),
  createBackgroundRule('ca-visa-background', ['white'], '#FFFFFF'),
  createFacePositionRule('ca-visa-face-position', 31, 36),
  createFileConstraintsRule('ca-visa-file', 4, ['image/jpeg', 'image/png']),
  createExpressionRule('ca-visa-expression'),
  createGlassesRule('ca-visa-glasses', true),
  createHeadCoveringRule('ca-visa-head-covering', true),
  createLightingRule('ca-visa-lighting'),
  createAspectRatioRule('ca-visa-aspect', 35 / 45, 1),
  createFormatRule('ca-visa-format', ['image/jpeg', 'image/png']),
];

// ============================================================================
// United States Rulesets
// ============================================================================

const US_PASSPORT_RULES: readonly ComplianceRule[] = [
  createDimensionRule('us-passport-dimension', 'US Passport Dimensions', 'Must be 2 × 2 inches (50.8 × 50.8 mm).', 50.8, 50.8, 0.5),
  createResolutionRule('us-passport-resolution', 300, 600, 600),
  createBackgroundRule('us-passport-background', ['white'], '#FFFFFF'),
  createFacePositionRule('us-passport-face-position', 25, 35, 0.5, 0.69),
  createFileConstraintsRule('us-passport-file', 10, ['image/jpeg', 'image/png']),
  createExpressionRule('us-passport-expression'),
  createGlassesRule('us-passport-glasses', false),
  createHeadCoveringRule('us-passport-head-covering', true),
  createLightingRule('us-passport-lighting'),
  createAspectRatioRule('us-passport-aspect', 1, 0),
  createFormatRule('us-passport-format', ['image/jpeg', 'image/png']),
];

const US_VISA_RULES: readonly ComplianceRule[] = [
  createDimensionRule('us-visa-dimension', 'US Visa Dimensions', 'Must be 2 × 2 inches (50.8 × 50.8 mm).', 50.8, 50.8, 0.5),
  createResolutionRule('us-visa-resolution', 300, 600, 600),
  createBackgroundRule('us-visa-background', ['white'], '#FFFFFF'),
  createFacePositionRule('us-visa-face-position', 25, 35, 0.5, 0.69),
  createFileConstraintsRule('us-visa-file', 10, ['image/jpeg'],
    { errorMessage: 'US visa photos must be JPEG format and smaller than 10 MB.' }
  ),
  createExpressionRule('us-visa-expression'),
  createGlassesRule('us-visa-glasses', false),
  createHeadCoveringRule('us-visa-head-covering', true),
  createLightingRule('us-visa-lighting'),
  createAspectRatioRule('us-visa-aspect', 1, 0),
  createFormatRule('us-visa-format', ['image/jpeg'],
    { errorMessage: 'US visa photos must be JPEG format.' }
  ),
];

const US_DRIVER_LICENSE_RULES: readonly ComplianceRule[] = [
  createDimensionRule('us-dl-dimension', 'US Driver License Dimensions', 'Generic 2 × 2 inches; verify state-specific rules.', 50.8, 50.8, 1),
  createResolutionRule('us-dl-resolution', 300, 600, 600,
    { severity: 'warning', description: 'Verify state-specific DPI requirements.' }
  ),
  createBackgroundRule('us-dl-background', ['white', 'light-gray', 'any']),
  createFacePositionRule('us-dl-face-position', undefined, undefined, 0.45, 0.7),
  createFileConstraintsRule('us-dl-file', 10, ['image/jpeg', 'image/png']),
  createExpressionRule('us-dl-expression', { severity: 'warning' }),
  createGlassesRule('us-dl-glasses', true, { severity: 'info' }),
  createHeadCoveringRule('us-dl-head-covering', true),
  createLightingRule('us-dl-lighting', { severity: 'warning' }),
  createAspectRatioRule('us-dl-aspect', 1, 2),
  createFormatRule('us-dl-format', ['image/jpeg', 'image/png']),
];

// ============================================================================
// India Rulesets
// ============================================================================

const INDIA_PASSPORT_RULES: readonly ComplianceRule[] = [
  createDimensionRule('in-passport-dimension', 'India Passport Dimensions', 'Must be 35 × 45 mm.', 35, 45, 0.5),
  createResolutionRule('in-passport-resolution', 300, 413, 531),
  createBackgroundRule('in-passport-background', ['white', 'light-gray'], '#FFFFFF'),
  createFacePositionRule('in-passport-face-position', 25, 35, 0.5, 0.75),
  createFileConstraintsRule('in-passport-file', 2, ['image/jpeg', 'image/png']),
  createExpressionRule('in-passport-expression'),
  createGlassesRule('in-passport-glasses', true),
  createHeadCoveringRule('in-passport-head-covering', true),
  createLightingRule('in-passport-lighting'),
  createAspectRatioRule('in-passport-aspect', 35 / 45, 1),
  createFormatRule('in-passport-format', ['image/jpeg', 'image/png']),
];

const INDIA_VISA_RULES: readonly ComplianceRule[] = [
  createDimensionRule('in-visa-dimension', 'India Visa Dimensions', 'Square format for e-visa upload.', 50.8, 50.8, 1),
  createResolutionRule('in-visa-resolution', 300, 350, 350),
  createBackgroundRule('in-visa-background', ['white'], '#FFFFFF'),
  createFacePositionRule('in-visa-face-position', undefined, undefined, 0.5, 0.75),
  createFileConstraintsRule('in-visa-file', 1, ['image/jpeg'],
    { errorMessage: 'India e-visa photos must be JPEG and smaller than 1 MB.' }
  ),
  createExpressionRule('in-visa-expression'),
  createGlassesRule('in-visa-glasses', true),
  createHeadCoveringRule('in-visa-head-covering', true),
  createLightingRule('in-visa-lighting'),
  createAspectRatioRule('in-visa-aspect', 1, 0),
  createFormatRule('in-visa-format', ['image/jpeg'],
    { errorMessage: 'India e-visa photos must be JPEG.' }
  ),
];

const INDIA_OCI_RULES: readonly ComplianceRule[] = [
  createDimensionRule('in-oci-dimension', 'OCI Photo Dimensions', 'Square 35 × 35 mm for OCI application.', 35, 35, 0.5),
  createResolutionRule('in-oci-resolution', 300, 360, 360),
  createBackgroundRule('in-oci-background', ['white'], '#FFFFFF'),
  createFacePositionRule('in-oci-face-position', undefined, undefined, 0.5, 0.75),
  createFileConstraintsRule('in-oci-file', 1, ['image/jpeg'],
    { errorMessage: 'OCI photos must be JPEG and smaller than 1 MB.' }
  ),
  createExpressionRule('in-oci-expression'),
  createGlassesRule('in-oci-glasses', true),
  createHeadCoveringRule('in-oci-head-covering', true),
  createLightingRule('in-oci-lighting'),
  createAspectRatioRule('in-oci-aspect', 1, 0),
  createFormatRule('in-oci-format', ['image/jpeg'],
    { errorMessage: 'OCI photos must be JPEG.' }
  ),
];

// ============================================================================
// Custom Preset Rulesets
// ============================================================================

const CUSTOM_35X45_RULES: readonly ComplianceRule[] = [
  createDimensionRule('custom-35x45-dimension', 'Custom Dimensions', 'Standard 35 × 45 mm.', 35, 45, 0.5),
  createResolutionRule('custom-35x45-resolution', 300, 413, 531, { severity: 'warning' }),
  createBackgroundRule('custom-35x45-background', ['white', 'light-gray', 'off-white', 'any']),
  createFacePositionRule('custom-35x45-face-position', undefined, undefined, 0.45, 0.75),
  createFileConstraintsRule('custom-35x45-file', 10, ['image/jpeg', 'image/png', 'image/webp']),
  createExpressionRule('custom-35x45-expression', { severity: 'warning' }),
  createGlassesRule('custom-35x45-glasses', true, { severity: 'warning' }),
  createHeadCoveringRule('custom-35x45-head-covering', true),
  createLightingRule('custom-35x45-lighting', { severity: 'warning' }),
  createAspectRatioRule('custom-35x45-aspect', 35 / 45, 1),
  createFormatRule('custom-35x45-format', ['image/jpeg', 'image/png', 'image/webp']),
];

// ============================================================================
// Ruleset Exports
// ============================================================================

/**
 * Collection of all compliance rulesets organized by presetId.
 */
export const COMPLIANCE_RULESETS: ReadonlyArray<ComplianceRuleset> = [
  {
    presetId: 'ca-passport-50x70',
    rules: [...CANADA_PASSPORT_RULES],
    version: RULESET_VERSION,
    lastUpdated: REVIEWED_AT,
  },
  {
    presetId: 'ca-pr-card-50x70',
    rules: [...CANADA_PR_CARD_RULES],
    version: RULESET_VERSION,
    lastUpdated: REVIEWED_AT,
  },
  {
    presetId: 'ca-visa-35x45',
    rules: [...CANADA_VISA_RULES],
    version: RULESET_VERSION,
    lastUpdated: REVIEWED_AT,
  },
  {
    presetId: 'us-passport-2x2',
    rules: [...US_PASSPORT_RULES],
    version: RULESET_VERSION,
    lastUpdated: REVIEWED_AT,
  },
  {
    presetId: 'us-visa-2x2',
    rules: [...US_VISA_RULES],
    version: RULESET_VERSION,
    lastUpdated: REVIEWED_AT,
  },
  {
    presetId: 'us-dl-2x2',
    rules: [...US_DRIVER_LICENSE_RULES],
    version: RULESET_VERSION,
    lastUpdated: REVIEWED_AT,
  },
  {
    presetId: 'in-passport-35x45',
    rules: [...INDIA_PASSPORT_RULES],
    version: RULESET_VERSION,
    lastUpdated: REVIEWED_AT,
  },
  {
    presetId: 'in-visa-35x45',
    rules: [...INDIA_VISA_RULES],
    version: RULESET_VERSION,
    lastUpdated: REVIEWED_AT,
  },
  {
    presetId: 'in-oci-35x35',
    rules: [...INDIA_OCI_RULES],
    version: RULESET_VERSION,
    lastUpdated: REVIEWED_AT,
  },
  {
    presetId: 'custom-photo-35x45',
    rules: [...CUSTOM_35X45_RULES],
    version: RULESET_VERSION,
    lastUpdated: REVIEWED_AT,
  },
];

/**
 * Rulesets by presetId lookup map for efficient access.
 */
export const COMPLIANCE_RULESETS_BY_PRESET_ID: ReadonlyMap<string, ComplianceRuleset> = new Map(
  COMPLIANCE_RULESETS.map(ruleset => [ruleset.presetId, ruleset])
);

/**
 * Advisory note for compliance validation.
 */
export { ADVISORY_NOTE };
