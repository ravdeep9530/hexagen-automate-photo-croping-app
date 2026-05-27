import { describe, it, expect } from 'vitest';
import { PhotoPresetSchema, PresetCatalogSchema } from '../../domain/presets';
import { ComplianceRulesetSchema, ComplianceRuleSchema } from '../../domain/compliance';
import { PHOTO_PRESETS, PHOTO_PRESET_CATALOG } from '../photo-presets';
import { COMPLIANCE_RULESETS } from '../compliance-rules';
import {
  CATALOG_VERSION,
  CATALOG_LAST_UPDATED,
  getAllPresets,
  getPresetById,
  getPresetsByCountry,
  getPresetsByDocumentType,
  getPresetsByCountryAndDocumentType,
  getActivePresets,
  getComplianceRuleset,
  getComplianceRulesForPreset,
  hasComplianceRuleset,
  getPresetIdsWithoutRulesets,
  validatePresetCatalog,
  validateComplianceRulesets,
  validateUniquePresetIds,
  searchPresets,
  getSupportedCountries,
  getSupportedDocumentTypes,
  validateFullCatalog,
} from '../catalog';

describe('Catalog Versioning', () => {
  it('exports a valid semantic version', () => {
    expect(CATALOG_VERSION).toMatch(/^\d{4}\.\d+\.\d+$/);
  });

  it('exports a valid ISO datetime for lastUpdated', () => {
    expect(CATALOG_LAST_UPDATED).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    expect(() => new Date(CATALOG_LAST_UPDATED)).not.toThrow();
  });
});

describe('Photo Presets', () => {
  it('presets meet schema requirements (acceptance criteria 1)', () => {
    for (const preset of PHOTO_PRESETS) {
      const result = PhotoPresetSchema.safeParse(preset);
      expect(result.success, `Preset ${preset.id} failed validation: ${result.success ? '' : result.error?.message}`).toBe(true);
    }
  });

  it('presets include stable IDs', () => {
    for (const preset of PHOTO_PRESETS) {
      expect(preset.id).toBeDefined();
      expect(typeof preset.id).toBe('string');
      expect(preset.id.length).toBeGreaterThan(0);
    }
  });

  it('presets include dimensions with DPI and pixel dimensions', () => {
    for (const preset of PHOTO_PRESETS) {
      expect(preset.dimensions.widthMm).toBeGreaterThan(0);
      expect(preset.dimensions.heightMm).toBeGreaterThan(0);
      expect(preset.dimensions.minDpi).toBeGreaterThanOrEqual(300);
      expect(preset.dimensions.widthPx).toBeDefined();
      expect(preset.dimensions.heightPx).toBeDefined();
    }
  });

  it('presets include background guidance', () => {
    for (const preset of PHOTO_PRESETS) {
      expect(preset.background).toBeDefined();
      expect(['white', 'light-gray', 'off-white', 'blue', 'any']).toContain(preset.background!.color);
    }
  });

  it('presets include source references with valid URLs', () => {
    for (const preset of PHOTO_PRESETS) {
      expect(preset.source).toBeDefined();
      expect(preset.source.url).toMatch(/^https?:\/\/.+/);
      expect(preset.source.authority).toBeDefined();
      expect(() => new Date(preset.source.lastReviewed)).not.toThrow();
    }
  });

  it('presets include advisory disclaimers', () => {
    for (const preset of PHOTO_PRESETS) {
      const hasDisclaimerInTags = preset.tags.some(tag =>
        tag.toLowerCase().includes('advisory') ||
        tag.toLowerCase().includes('guidance') ||
        tag.toLowerCase().includes('acceptance')
      );
      const hasDisclaimer = preset.tags.join(' ').includes('Advisory') || hasDisclaimerInTags;
      expect(hasDisclaimer, `Preset ${preset.id} should include advisory disclaimer`).toBe(true);
    }
  });
});

describe('Compliance Rules', () => {
  it('compliance rules meet schema requirements (acceptance criteria 2)', () => {
    for (const ruleset of COMPLIANCE_RULESETS) {
      const rulesetResult = ComplianceRulesetSchema.safeParse(ruleset);
      expect(rulesetResult.success, `Ruleset for ${ruleset.presetId} failed: ${rulesetResult.success ? '' : rulesetResult.error?.message}`).toBe(true);

      for (const rule of ruleset.rules) {
        const ruleResult = ComplianceRuleSchema.safeParse(rule);
        expect(ruleResult.success, `Rule ${rule.id} in ${ruleset.presetId} failed: ${ruleResult.success ? '' : ruleResult.error?.message}`).toBe(true);
      }
    }
  });

  it('includes dimension rules', () => {
    const allRules = COMPLIANCE_RULESETS.flatMap(r => r.rules);
    const dimensionRules = allRules.filter(r => r.type === 'dimension');
    expect(dimensionRules.length).toBeGreaterThan(0);
  });

  it('includes background rules', () => {
    const allRules = COMPLIANCE_RULESETS.flatMap(r => r.rules);
    const backgroundRules = allRules.filter(r => r.type === 'background');
    expect(backgroundRules.length).toBeGreaterThan(0);
  });

  it('includes face-position rules', () => {
    const allRules = COMPLIANCE_RULESETS.flatMap(r => r.rules);
    const facePositionRules = allRules.filter(r => r.type === 'face-position');
    expect(facePositionRules.length).toBeGreaterThan(0);
  });

  it('includes resolution rules', () => {
    const allRules = COMPLIANCE_RULESETS.flatMap(r => r.rules);
    const resolutionRules = allRules.filter(r => r.type === 'resolution');
    expect(resolutionRules.length).toBeGreaterThan(0);
  });

  it('includes file-type rules', () => {
    const allRules = COMPLIANCE_RULESETS.flatMap(r => r.rules);
    const formatRules = allRules.filter(r => r.type === 'format');
    expect(formatRules.length).toBeGreaterThan(0);
  });

  it('includes manual checklist items (manual/semi-automatic rules)', () => {
    const allRules = COMPLIANCE_RULESETS.flatMap(r => r.rules);
    const manualRules = allRules.filter(r => r.enforcement === 'manual');
    const semiAutoRules = allRules.filter(r => r.enforcement === 'semi-automatic');
    expect(manualRules.length + semiAutoRules.length).toBeGreaterThan(0);
  });
});

describe('Catalog Accessors', () => {
  describe('getPresetById', () => {
    it('supports lookup by presetId (acceptance criteria 3)', () => {
      const caPassport = getPresetById('ca-passport-50x70');
      expect(caPassport).toBeDefined();
      expect(caPassport?.country).toBe('CA');
      expect(caPassport?.documentType).toBe('passport');

      const usVisa = getPresetById('us-visa-2x2');
      expect(usVisa).toBeDefined();
      expect(usVisa?.country).toBe('US');

      const inOci = getPresetById('in-oci-35x35');
      expect(inOci).toBeDefined();
      expect(inOci?.country).toBe('IN');
    });

    it('returns undefined for invalid presetId', () => {
      const result = getPresetById('invalid-preset-id');
      expect(result).toBeUndefined();
    });
  });

  describe('getPresetsByCountry', () => {
    it('supports filtering by country (acceptance criteria 3)', () => {
      const canadaPresets = getPresetsByCountry('CA');
      expect(canadaPresets.length).toBeGreaterThanOrEqual(3);
      expect(canadaPresets.every(p => p.country === 'CA')).toBe(true);

      const usPresets = getPresetsByCountry('US');
      expect(usPresets.length).toBeGreaterThanOrEqual(3);
      expect(usPresets.every(p => p.country === 'US')).toBe(true);

      const indiaPresets = getPresetsByCountry('IN');
      expect(indiaPresets.length).toBeGreaterThanOrEqual(3);
      expect(indiaPresets.every(p => p.country === 'IN')).toBe(true);
    });

    it('filters case-insensitively', () => {
      const ca1 = getPresetsByCountry('ca');
      const ca2 = getPresetsByCountry('CA');
      expect(ca1).toEqual(ca2);
    });
  });

  describe('getPresetsByDocumentType', () => {
    it('supports filtering by category (acceptance criteria 3)', () => {
      const passports = getPresetsByDocumentType('passport');
      expect(passports.length).toBeGreaterThan(0);
      expect(passports.every(p => p.documentType === 'passport')).toBe(true);

      const visas = getPresetsByDocumentType('visa');
      expect(visas.length).toBeGreaterThan(0);
      expect(visas.every(p => p.documentType === 'visa')).toBe(true);

      const idCards = getPresetsByDocumentType('id-card');
      expect(idCards.length).toBeGreaterThanOrEqual(1);
      expect(idCards.every(p => p.documentType === 'id-card')).toBe(true);
    });
  });

  describe('getPresetsByCountryAndDocumentType', () => {
    it('supports combined filtering', () => {
      const caPassports = getPresetsByCountryAndDocumentType('CA', 'passport');
      expect(caPassports.length).toBeGreaterThanOrEqual(1);
      expect(caPassports.every(p => p.country === 'CA' && p.documentType === 'passport')).toBe(true);

      const usVisas = getPresetsByCountryAndDocumentType('US', 'visa');
      expect(usVisas.length).toBeGreaterThanOrEqual(1);
      expect(usVisas.every(p => p.country === 'US' && p.documentType === 'visa')).toBe(true);
    });
  });

  describe('getComplianceRuleset', () => {
    it('retrieves compliance ruleset by presetId', () => {
      const caPassportRules = getComplianceRuleset('ca-passport-50x70');
      expect(caPassportRules).toBeDefined();
      expect(caPassportRules?.rules.length).toBeGreaterThan(0);
    });

    it('returns undefined for unknown presetId', () => {
      const result = getComplianceRuleset('unknown-preset');
      expect(result).toBeUndefined();
    });
  });

  describe('getComplianceRulesForPreset', () => {
    it('returns rules array for existing preset', () => {
      const rules = getComplianceRulesForPreset('us-passport-2x2');
      expect(rules.length).toBeGreaterThan(0);
    });

    it('returns empty array for unknown preset', () => {
      const rules = getComplianceRulesForPreset('unknown-preset');
      expect(rules).toEqual([]);
    });
  });
});

describe('ID Uniqueness (acceptance criteria 4)', () => {
  it('all preset IDs are unique', () => {
    const ids = PHOTO_PRESETS.map(p => p.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('validateUniquePresetIds returns valid result', () => {
    const result = validateUniquePresetIds();
    expect(result.valid).toBe(true);
  });

  it('each preset has a stable ID format', () => {
    for (const preset of PHOTO_PRESETS) {
      expect(preset.id).toMatch(/^[a-z]{2}-[a-z\-0-9]+$/);
    }
  });
});

describe('Schema Validation (acceptance criteria 5)', () => {
  it('preset catalog validates against Zod schema', () => {
    const result = validatePresetCatalog();
    expect(result.success).toBe(true);
  });

  it('compliance rulesets validate against Zod schema', () => {
    const result = validateComplianceRulesets();
    expect(result.success).toBe(true);
  });

  it('preset catalog schema accepts valid data', () => {
    const result = PresetCatalogSchema.safeParse(PHOTO_PRESET_CATALOG);
    expect(result.success).toBe(true);
  });
});

describe('Catalog Coverage', () => {
  it('includes Canada, US, and India coverage', () => {
    const countries = getSupportedCountries();
    expect(countries).toContain('CA');
    expect(countries).toContain('US');
    expect(countries).toContain('IN');
  });

  it('includes passport, visa, PR card, OCI, driver license, and custom presets', () => {
    const passports = getPresetsByDocumentType('passport');
    const visas = getPresetsByDocumentType('visa');
    const idCards = getPresetsByDocumentType('id-card');
    const drivingLicenses = getPresetsByDocumentType('driving-license');
    const others = getPresetsByDocumentType('other');

    expect(passports.length).toBeGreaterThanOrEqual(3); // CA, US, IN
    expect(visas.length).toBeGreaterThanOrEqual(3); // CA, US, IN
    expect(idCards.length).toBeGreaterThanOrEqual(1); // CA PR Card
    expect(drivingLicenses.length).toBeGreaterThanOrEqual(1); // US DL
    expect(others.length).toBeGreaterThanOrEqual(2); // IN OCI, Custom
  });

  it('all active presets have compliance rulesets', () => {
    const activePresets = getActivePresets();
    const idsWithoutRules = getPresetIdsWithoutRulesets();
    expect(idsWithoutRules.length).toBe(0);
    const presetsWithRules = activePresets.filter(p => hasComplianceRuleset(p.id));
    expect(presetsWithRules.length).toBe(activePresets.length);
  });
});

describe('Full Catalog Validation', () => {
  it('validateFullCatalog returns valid result', () => {
    const result = validateFullCatalog();
    expect(result.valid).toBe(true);
    expect(result.presetCatalogValid).toBe(true);
    expect(result.complianceRulesValid).toBe(true);
    expect(result.presetIdsUnique).toBe(true);
    expect(result.allPresetsHaveRules).toBe(true);
    expect(result.orphanPresetIds).toEqual([]);
    expect(result.errors).toEqual([]);
  });
});

describe('Search and Utilities', () => {
  it('searchPresets finds matches by name', () => {
    const results = searchPresets('Canada');
    expect(results.length).toBeGreaterThan(0);
    expect(results.every(p => p.name.toLowerCase().includes('canada'))).toBe(true);
  });

  it('searchPresets finds matches by tag', () => {
    const results = searchPresets('passport');
    expect(results.length).toBeGreaterThan(0);
  });

  it('getSupportedCountries returns all unique countries', () => {
    const countries = getSupportedCountries();
    expect(countries.length).toBeGreaterThanOrEqual(4); // CA, US, IN, CUSTOM
  });

  it('getSupportedDocumentTypes returns all unique types', () => {
    const types = getSupportedDocumentTypes();
    expect(types).toContain('passport');
    expect(types).toContain('visa');
    expect(types).toContain('id-card');
    expect(types).toContain('driving-license');
    expect(types).toContain('other');
  });
});

describe('Ruleset Integrity', () => {
  it('all rulesets reference existing presets', () => {
    const presetIds = new Set(PHOTO_PRESETS.map(p => p.id));
    for (const ruleset of COMPLIANCE_RULESETS) {
      expect(presetIds.has(ruleset.presetId), `Ruleset references unknown preset: ${ruleset.presetId}`).toBe(true);
    }
  });

  it('each ruleset has version and lastUpdated', () => {
    for (const ruleset of COMPLIANCE_RULESETS) {
      expect(ruleset.version).toMatch(/^\d{4}\.\d+\.\d+$/);
      expect(() => new Date(ruleset.lastUpdated)).not.toThrow();
    }
  });

  it('rules have appropriate severity levels', () => {
    const allRules = COMPLIANCE_RULESETS.flatMap(r => r.rules);
    for (const rule of allRules) {
      expect(['error', 'warning', 'info']).toContain(rule.severity);
    }
  });

  it('rules have appropriate enforcement modes', () => {
    const allRules = COMPLIANCE_RULESETS.flatMap(r => r.rules);
    for (const rule of allRules) {
      expect(['automatic', 'semi-automatic', 'manual']).toContain(rule.enforcement);
    }
  });
});
