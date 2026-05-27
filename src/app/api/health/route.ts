import { NextResponse } from 'next/server';
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
