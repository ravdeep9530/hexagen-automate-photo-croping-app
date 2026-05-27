import { z } from 'zod';

/**
 * Source reference for a preset (government authority)
 */
export const SourceReferenceSchema = z.object({
  country: z.string(),
  authority: z.string(),
  url: z.string().url(),
  lastReviewed: z.string().datetime(),
  documentType: z.string(),
});

export type SourceReference = z.infer<typeof SourceReferenceSchema>;

/**
 * Dimension specification in various units
 */
export const DimensionSpecSchema = z.object({
  widthMm: z.number().positive(),
  heightMm: z.number().positive(),
  widthPx: z.number().int().positive().optional(),
  heightPx: z.number().int().positive().optional(),
  minDpi: z.number().int().positive().default(300),
});

export type DimensionSpec = z.infer<typeof DimensionSpecSchema>;

/**
 * File constraints for preset
 */
export const FileConstraintsSchema = z.object({
  maxFileSizeMb: z.number().positive().default(10),
  acceptedFormats: z.array(z.enum(['image/jpeg', 'image/png', 'image/webp'])).default(['image/jpeg', 'image/png']),
  minResolution: z.object({
    width: z.number().int().positive(),
    height: z.number().int().positive(),
  }).optional(),
});

export type FileConstraints = z.infer<typeof FileConstraintsSchema>;

/**
 * Face position requirements
 */
export const FacePositionSchema = z.object({
  minEyeDistanceMm: z.number().positive().optional(),
  maxEyeDistanceMm: z.number().positive().optional(),
  chinToTopOfHeadMm: z.object({
    min: z.number().positive(),
    max: z.number().positive(),
  }).optional(),
  eyeHeightPosition: z.object({
    min: z.number().min(0).max(1),
    max: z.number().min(0).max(1),
  }).optional(),
});

export type FacePosition = z.infer<typeof FacePositionSchema>;

/**
 * Background requirements
 */
export const BackgroundRequirementSchema = z.object({
  color: z.enum(['white', 'light-gray', 'off-white', 'blue', 'any']),
  hexCode: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  shadowAllowed: z.boolean().default(false),
});

export type BackgroundRequirement = z.infer<typeof BackgroundRequirementSchema>;

/**
 * PhotoPreset - Complete passport/visa photo specification
 */
export const PhotoPresetSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  country: z.string(),
  documentType: z.enum(['passport', 'visa', 'id-card', 'driving-license', 'other']),
  dimensions: DimensionSpecSchema,
  fileConstraints: FileConstraintsSchema.default({}),
  facePosition: FacePositionSchema.optional(),
  background: BackgroundRequirementSchema.optional(),
  source: SourceReferenceSchema,
  isActive: z.boolean().default(true),
  tags: z.array(z.string()).default([]),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type PhotoPreset = z.infer<typeof PhotoPresetSchema>;

/**
 * Preset catalog - collection of all presets
 */
export const PresetCatalogSchema = z.object({
  version: z.string(),
  presets: z.array(PhotoPresetSchema),
  lastUpdated: z.string().datetime(),
});

export type PresetCatalog = z.infer<typeof PresetCatalogSchema>;

/**
 * Validation result for preset catalog
 */
export function validatePresetCatalog(data: unknown): { success: true; data: PresetCatalog } | { success: false; error: z.ZodError } {
  const result = PresetCatalogSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}

/**
 * Find preset by ID
 */
export function findPresetById(catalog: PresetCatalog, id: string): PhotoPreset | undefined {
  return catalog.presets.find(p => p.id === id);
}

/**
 * Get active presets only
 */
export function getActivePresets(catalog: PresetCatalog): PhotoPreset[] {
  return catalog.presets.filter(p => p.isActive);
}

/**
 * Filter presets by country
 */
export function filterPresetsByCountry(catalog: PresetCatalog, country: string): PhotoPreset[] {
  return catalog.presets.filter(p => p.country.toLowerCase() === country.toLowerCase());
}

/**
 * Filter presets by document type
 */
export function filterPresetsByDocumentType(
  catalog: PresetCatalog,
  documentType: PhotoPreset['documentType']
): PhotoPreset[] {
  return catalog.presets.filter(p => p.documentType === documentType);
}
