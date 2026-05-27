import { NextResponse, type NextRequest } from 'next/server';
import {
  CATALOG_VERSION,
  getAllComplianceRulesets,
  getComplianceRuleset,
  getPresetById,
  getAllPresets,
  getSupportedCountries,
} from '@/data/catalog';
import { ComplianceRulesetSchema, type ComplianceRuleset } from '@/domain/compliance';
import {
  apiError,
  validateAllowedSearchParams,
  validateFilterValue,
  type ApiErrorPayload,
  type ApiErrorCode,
} from '../_lib/static-api';

const ALLOWED_PARAMS = ['presetId', 'country'] as const;

export interface ComplianceRulesResponse {
  version: string;
  rulesets: ComplianceRuleset[];
  count: number;
  filters?: {
    presetId?: string;
    country?: string;
  };
}

/**
 * GET /api/compliance-rules
 *
 * Returns validated compliance rules.
 *
 * Query parameters:
 * - presetId: Filter by specific preset ID
 * - country: Filter by ISO country code (e.g., 'CA', 'US', 'IN')
 *
 * Returns 400 for unsupported filter values.
 */
export function GET(request: NextRequest): NextResponse<ComplianceRulesResponse | ApiErrorPayload> {
  const { searchParams } = new URL(request.url);

  // Validate only allowed params are present
  const paramError = validateAllowedSearchParams(searchParams, ALLOWED_PARAMS);
  if (paramError) {
    return NextResponse.json(paramError, { status: 400 });
  }

  // Get supported valid values
  const allPresets = getAllPresets();
  const supportedPresetIds = new Set(allPresets.map((p) => p.id));
  const supportedCountries = new Set(getSupportedCountries());

  // Validate presetId filter
  const presetIdParam = searchParams.get('presetId');
  const presetIdResult = validateFilterValue(
    'presetId',
    presetIdParam,
    supportedPresetIds
  );
  if (presetIdResult.error) {
    return NextResponse.json(presetIdResult.error, { status: 400 });
  }

  // Validate country filter
  const countryParam = searchParams.get('country');
  const countryResult = validateFilterValue(
    'country',
    countryParam,
    supportedCountries,
    { normalize: (v) => v.toUpperCase() }
  );
  if (countryResult.error) {
    return NextResponse.json(countryResult.error, { status: 400 });
  }

  // Both filters are invalid if presetId is provided but country is also provided
  // (mutually exclusive - if presetId is specified, it takes precedence)
  const filters: ComplianceRulesResponse['filters'] = {};

  let rulesets: ComplianceRuleset[];

  if (presetIdResult.value) {
    const ruleset = getComplianceRuleset(presetIdResult.value);
    if (!ruleset) {
      return NextResponse.json(
        apiError(
          'UNSUPPORTED_FILTER_VALUE',
          `No compliance rules found for presetId: ${presetIdResult.value}.`,
          { field: 'presetId', value: presetIdResult.value }
        ),
        { status: 400 }
      );
    }
    rulesets = [ruleset];
    filters.presetId = presetIdResult.value;

    // Validate the country filter if presetId is specified - must match preset's country
    if (countryResult.value) {
      const preset = getPresetById(presetIdResult.value);
      if (preset && preset.country.toUpperCase() !== countryResult.value) {
        return NextResponse.json(
          apiError(
            'UNSUPPORTED_FILTER_VALUE',
            `Preset ${presetIdResult.value} does not belong to country ${countryResult.value}.`,
            { field: 'country', value: countryResult.value }
          ),
          { status: 400 }
        );
      }
      filters.country = countryResult.value;
    }
  } else if (countryResult.value) {
    // Get all presets for the country and then their rulesets
    const countryPresets = allPresets.filter(
      (p) => p.country.toUpperCase() === countryResult.value
    );
    rulesets = countryPresets
      .map((p) => getComplianceRuleset(p.id))
      .filter((r): r is ComplianceRuleset => r !== undefined);
    filters.country = countryResult.value;
  } else {
    rulesets = [...getAllComplianceRulesets()];
  }

  // Validate each ruleset against schema before returning
  for (const ruleset of rulesets) {
    const parseResult = ComplianceRulesetSchema.safeParse(ruleset);
    if (!parseResult.success) {
      return NextResponse.json(
        apiError(
          'CATALOG_VALIDATION_FAILED',
          `Ruleset for preset ${ruleset.presetId} failed validation: ${parseResult.error.message}`
        ),
        { status: 500 }
      );
    }
  }

  return NextResponse.json({
    version: CATALOG_VERSION,
    rulesets,
    count: rulesets.length,
    ...(Object.keys(filters).length > 0 ? { filters } : {}),
  });
}
