import { NextResponse, type NextRequest } from 'next/server';
import {
  CATALOG_VERSION,
  getAllPresets,
  getPresetsByCountry,
  getPresetsByDocumentType,
  getPresetsByCountryAndDocumentType,
  getSupportedCountries,
  getSupportedDocumentTypes,
} from '@/data/catalog';
import { PhotoPresetSchema, type PhotoPreset } from '@/domain/presets';
import {
  apiError,
  methodNotAllowed,
  validateAllowedSearchParams,
  validateFilterValue,
  type ApiErrorPayload,
} from '../_lib/static-api';

const ALLOWED_PARAMS = ['country', 'category'] as const;

export interface PresetsResponse {
  version: string;
  presets: PhotoPreset[];
  count: number;
  filters?: {
    country?: string;
    category?: string;
  };
}

/**
 * GET /api/presets
 *
 * Returns validated preset data.
 *
 * Query parameters:
 * - country: Filter by ISO country code (e.g., 'CA', 'US', 'IN')
 * - category: Filter by document type (e.g., 'passport', 'visa', 'id-card')
 *
 * Returns 400 for unsupported filter values.
 */
export function GET(request: NextRequest): NextResponse<PresetsResponse | ApiErrorPayload> {
  const { searchParams } = new URL(request.url);

  const paramError = validateAllowedSearchParams(searchParams, ALLOWED_PARAMS);
  if (paramError) {
    return NextResponse.json(paramError, { status: 400 });
  }

  const supportedCountries = new Set(getSupportedCountries());
  const supportedCategories = new Set(getSupportedDocumentTypes());

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

  const categoryParam = searchParams.get('category');
  const categoryResult = validateFilterValue(
    'category',
    categoryParam,
    supportedCategories,
    { normalize: (v) => v.toLowerCase() }
  );
  if (categoryResult.error) {
    return NextResponse.json(categoryResult.error, { status: 400 });
  }

  let presets: PhotoPreset[];
  const filters: PresetsResponse['filters'] = {};

  if (countryResult.value && categoryResult.value) {
    presets = getPresetsByCountryAndDocumentType(countryResult.value, categoryResult.value as PhotoPreset['documentType']);
    filters.country = countryResult.value;
    filters.category = categoryResult.value;
  } else if (countryResult.value) {
    presets = getPresetsByCountry(countryResult.value);
    filters.country = countryResult.value;
  } else if (categoryResult.value) {
    presets = getPresetsByDocumentType(categoryResult.value as PhotoPreset['documentType']);
    filters.category = categoryResult.value;
  } else {
    presets = [...getAllPresets()];
  }

  for (const preset of presets) {
    const parseResult = PhotoPresetSchema.safeParse(preset);
    if (!parseResult.success) {
      return NextResponse.json(
        apiError(
          'CATALOG_VALIDATION_FAILED',
          `Preset ${preset.id} failed validation: ${parseResult.error.message}`
        ),
        { status: 500 }
      );
    }
  }

  return NextResponse.json({
    version: CATALOG_VERSION,
    presets,
    count: presets.length,
    ...(Object.keys(filters).length > 0 ? { filters } : {}),
  });
}

export function POST(): ReturnType<typeof methodNotAllowed> {
  return methodNotAllowed(['GET']);
}

export function PUT(): ReturnType<typeof methodNotAllowed> {
  return methodNotAllowed(['GET']);
}

export function PATCH(): ReturnType<typeof methodNotAllowed> {
  return methodNotAllowed(['GET']);
}

export function DELETE(): ReturnType<typeof methodNotAllowed> {
  return methodNotAllowed(['GET']);
}

export function OPTIONS(): NextResponse {
  return new NextResponse(null, {
    status: 204,
    headers: {
      Allow: 'GET, OPTIONS',
    },
  });
}
