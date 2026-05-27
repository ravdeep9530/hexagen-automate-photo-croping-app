import { NextResponse } from 'next/server';
import { methodNotAllowed } from '../_lib/static-api';
import { CATALOG_VERSION } from '@/data/catalog';

export interface HealthResponse {
  status: 'healthy';
  version: string;
  commit: string;
}

/**
 * GET /api/health
 *
 * Returns basic health status for the application.
 * Includes version and commit information if available.
 */
export function GET(): NextResponse<HealthResponse> {
  const commit = process.env.COMMIT_SHA ?? 'development';
  const version = CATALOG_VERSION;

  return NextResponse.json({
    status: 'healthy',
    version,
    commit,
  });
}

/**
 * Disallow all other HTTP methods for privacy and security.
 * This static metadata endpoint only supports GET.
 */
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
