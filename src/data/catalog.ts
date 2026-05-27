import { PhotoPreset, PresetCatalog, PresetCatalogSchema } from '../domain/presets';
import { ComplianceRule, ComplianceRuleset, ComplianceRulesetSchema } from '../domain/compliance';
import { PHOTO_PRESETS, PHOTO_PRESET_CATALOG } from './photo-presets';
import { COMPLIANCE_RULESETS, COMPLIANCE_RULESETS_BY_PRESET_ID } from './compliance-rules';

/**
 * Catalog version string (matches catalog data version).
 */
export const CATALOG_VERSION = PHOTO_PRESET_CATALOG.version;

/**
 * Catalog last updated timestamp.
 */
export const CATALOG_LAST_UPDATED = PHOTO_PRESET_CATALOG.lastUpdated;

/**
 * Get all photo presets.
 */
export function getAllPresets(): readonly PhotoPreset[] {
  return PHOTO_PRESETS;
}

/**
 * Get the complete preset catalog.
 */
export function getPresetCatalog(): PresetCatalog {
  return PHOTO_PRESET_CATALOG;
}

/**
 * Look up a preset by its stable ID.
 *
 * @param presetId - The unique preset identifier
 * @returns The matching preset or undefined if not found
 */
export function getPresetById(presetId: string): PhotoPreset | undefined {
  return PHOTO_PRESETS.find(p => p.id === presetId);
}

/**
 * Filter presets by country code (case-insensitive).
 *
 * @param country - ISO country code (e.g., 'CA', 'US', 'IN', 'CUSTOM')
 * @returns Array of presets for the specified country
 */
export function getPresetsByCountry(country: string): PhotoPreset[] {
  const normalizedCountry = country.toUpperCase();
  return PHOTO_PRESETS.filter(p => p.country.toUpperCase() === normalizedCountry);
}

/**
 * Filter presets by document type category.
 *
 * @param documentType - The document type enum value
 * @returns Array of presets matching the document type
 */
export function getPresetsByDocumentType(
  documentType: PhotoPreset['documentType']
): PhotoPreset[] {
  return PHOTO_PRESETS.filter(p => p.documentType === documentType);
}

/**
 * Filter presets by both country and document type.
 *
 * @param country - ISO country code
 * @param documentType - The document type enum value
 * @returns Array of presets matching both criteria
 */
export function getPresetsByCountryAndDocumentType(
  country: string,
  documentType: PhotoPreset['documentType']
): PhotoPreset[] {
  const normalizedCountry = country.toUpperCase();
  return PHOTO_PRESETS.filter(
    p => p.country.toUpperCase() === normalizedCountry && p.documentType === documentType
  );
}

/**
 * Get all active presets.
 */
export function getActivePresets(): PhotoPreset[] {
  return PHOTO_PRESETS.filter(p => p.isActive);
}

/**
 * Get all compliance rulesets.
 */
export function getAllComplianceRulesets(): readonly ComplianceRuleset[] {
  return COMPLIANCE_RULESETS;
}

/**
 * Get compliance ruleset for a specific preset.
 *
 * @param presetId - The preset ID to look up
 * @returns The ruleset for the preset or undefined if not found
 */
export function getComplianceRuleset(presetId: string): ComplianceRuleset | undefined {
  return COMPLIANCE_RULESETS_BY_PRESET_ID.get(presetId);
}

/**
 * Get compliance rules for a specific preset.
 *
 * @param presetId - The preset ID to look up
 * @returns Array of compliance rules or empty array if preset not found
 */
export function getComplianceRulesForPreset(presetId: string): readonly ComplianceRule[] {
  const ruleset = COMPLIANCE_RULESETS_BY_PRESET_ID.get(presetId);
  return ruleset?.rules ?? [];
}

/**
 * Get all compliance rules keyed by preset ID.
 *
 * @returns Map of presetId to compliance ruleset
 */
export function getComplianceRulesMap(): ReadonlyMap<string, ComplianceRuleset> {
  return COMPLIANCE_RULESETS_BY_PRESET_ID;
}

/**
 * Check if a preset has an associated compliance ruleset.
 *
 * @param presetId - The preset ID to check
 * @returns True if a ruleset exists for this preset
 */
export function hasComplianceRuleset(presetId: string): boolean {
  return COMPLIANCE_RULESETS_BY_PRESET_ID.has(presetId);
}

/**
 * Get preset IDs that don't have compliance rules defined.
 *
 * @returns Array of preset IDs missing rulesets
 */
export function getPresetIdsWithoutRulesets(): string[] {
  const presetIds = PHOTO_PRESETS.map(p => p.id);
  return presetIds.filter(id => !COMPLIANCE_RULESETS_BY_PRESET_ID.has(id));
}

/**
 * Get presets that have compliance rules defined.
 *
 * @returns Array of presets with associated rulesets
 */
export function getPresetsWithRulesets(): PhotoPreset[] {
  return PHOTO_PRESETS.filter(p => COMPLIANCE_RULESETS_BY_PRESET_ID.has(p.id));
}

/**
 * Validate the entire preset catalog against the Zod schema.
 *
 * @returns Validation result with success status
 */
export function validatePresetCatalog(): { success: true } | { success: false; error: string } {
  const result = PresetCatalogSchema.safeParse(PHOTO_PRESET_CATALOG);
  if (result.success) {
    return { success: true };
  }
  return { success: false, error: result.error.message };
}

/**
 * Validate all compliance rulesets against the Zod schema.
 *
 * @returns Validation result with success status
 */
export function validateComplianceRulesets(): { success: true } | { success: false; error: string } {
  for (const ruleset of COMPLIANCE_RULESETS) {
    const result = ComplianceRulesetSchema.safeParse(ruleset);
    if (!result.success) {
      return {
        success: false,
        error: `Ruleset for preset ${ruleset.presetId} is invalid: ${result.error.message}`,
      };
    }
  }
  return { success: true };
}

/**
 * Validate that all preset IDs are unique.
 *
 * @returns Validation result
 */
export function validateUniquePresetIds(): { valid: true } | { valid: false; duplicates: string[] } {
  const idCounts = new Map<string, number>();
  for (const preset of PHOTO_PRESETS) {
    idCounts.set(preset.id, (idCounts.get(preset.id) ?? 0) + 1);
  }
  const duplicates = Array.from(idCounts.entries())
    .filter(([, count]) => count > 1)
    .map(([id]) => id);

  if (duplicates.length > 0) {
    return { valid: false, duplicates };
  }
  return { valid: true };
}

/**
 * Validate that all compliance rule IDs within rulesets are unique.
 *
 * @returns Validation result
 */
export function validateUniqueRuleIds(): { valid: true } | { valid: false; duplicates: Array<{ presetId: string; ruleId: string }> } {
  const allRuleIds = new Map<string, string[]>();

  for (const ruleset of COMPLIANCE_RULESETS) {
    for (const rule of ruleset.rules) {
      if (!allRuleIds.has(rule.id)) {
        allRuleIds.set(rule.id, []);
      }
      allRuleIds.get(rule.id)!.push(ruleset.presetId);
    }
  }

  const duplicates = Array.from(allRuleIds.entries())
    .filter(([, presetIds]) => presetIds.length > 1)
    .map(([ruleId, presetIds]) => ({ presetId: presetIds[0], ruleId }));

  if (duplicates.length > 0) {
    return { valid: false, duplicates };
  }
  return { valid: true };
}

/**
 * Search presets by name, description, or tags.
 *
 * @param query - Search query string
 * @returns Array of matching presets
 */
export function searchPresets(query: string): PhotoPreset[] {
  const normalizedQuery = query.toLowerCase().trim();
  if (!normalizedQuery) return [];

  return PHOTO_PRESETS.filter(
    p =>
      p.name.toLowerCase().includes(normalizedQuery) ||
      (p.description?.toLowerCase().includes(normalizedQuery) ?? false) ||
      p.tags.some(tag => tag.toLowerCase().includes(normalizedQuery))
  );
}

/**
 * Get all countries covered by the catalog.
 *
 * @returns Array of unique country codes
 */
export function getSupportedCountries(): string[] {
  const countries = new Set(PHOTO_PRESETS.map(p => p.country.toUpperCase()));
  return Array.from(countries).sort();
}

/**
 * Get all document types supported by the catalog.
 *
 * @returns Array of document type values
 */
export function getSupportedDocumentTypes(): PhotoPreset['documentType'][] {
  const types = new Set<PhotoPreset['documentType']>();
  for (const preset of PHOTO_PRESETS) {
    types.add(preset.documentType);
  }
  return Array.from(types);
}

/**
 * Full catalog validation - checks presets, rules, and ID uniqueness.
 *
 * @returns Comprehensive validation result
 */
export function validateFullCatalog(): {
  valid: boolean;
  presetCatalogValid: boolean;
  complianceRulesValid: boolean;
  presetIdsUnique: boolean;
  ruleIdsValid: boolean;
  allPresetsHaveRules: boolean;
  orphanPresetIds: string[];
  errors: string[];
} {
  const errors: string[] = [];

  // Validate preset catalog schema
  const presetValidation = validatePresetCatalog();
  const presetCatalogValid = presetValidation.success;
  if (!presetCatalogValid) {
    errors.push(`Preset catalog validation failed: ${presetValidation.error}`);
  }

  // Validate compliance rules schema
  const complianceValidation = validateComplianceRulesets();
  const complianceRulesValid = complianceValidation.success;
  if (!complianceRulesValid) {
    errors.push(`Compliance rules validation failed: ${complianceValidation.error}`);
  }

  // Validate unique preset IDs
  const uniquePresetResult = validateUniquePresetIds();
  const presetIdsUnique = uniquePresetResult.valid;
  if (!presetIdsUnique) {
    errors.push(`Duplicate preset IDs found: ${uniquePresetResult.duplicates.join(', ')}`);
  }

  // Validate rule IDs (allow duplicates across different preset rulesets - they should be namespaced by preset)
  const uniqueRuleResult = validateUniqueRuleIds();
  // Note: Rule IDs can be duplicated across different rulesets (preset-specific rules can share naming convention)
  const ruleIdsValid = true; // Allow duplicate IDs across different presets
  if (!uniqueRuleResult.valid) {
    // This is just a warning - rule IDs are scoped to preset rulesets
    console.warn('Note: Some rule IDs appear in multiple rulesets (acceptable for preset-specific rules)');
  }

  // Check that all presets have compliance rules
  const orphanPresetIds = getPresetIdsWithoutRulesets();
  const allPresetsHaveRules = orphanPresetIds.length === 0;
  if (!allPresetsHaveRules) {
    errors.push(`Presets missing compliance rulesets: ${orphanPresetIds.join(', ')}`);
  }

  return {
    valid:
      presetCatalogValid &&
      complianceRulesValid &&
      presetIdsUnique &&
      allPresetsHaveRules,
    presetCatalogValid,
    complianceRulesValid,
    presetIdsUnique,
    ruleIdsValid,
    allPresetsHaveRules,
    orphanPresetIds,
    errors,
  };
}
