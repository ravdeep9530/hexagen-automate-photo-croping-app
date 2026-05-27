import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '../presets/route';

function request(path: string): NextRequest {
  return new NextRequest(`https://example.test${path}`);
}

describe('GET /api/presets', () => {
  it('returns validated preset data', async () => {
    const response = GET(request('/api/presets'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.version).toMatch(/^\d{4}\.\d+\.\d+$/);
    expect(body.count).toBeGreaterThan(0);
    expect(body.presets).toHaveLength(body.count);
    expect(body.presets[0]).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        country: expect.any(String),
        documentType: expect.any(String),
        dimensions: expect.any(Object),
      })
    );
  });

  it('supports optional country and category filters', async () => {
    const response = GET(request('/api/presets?country=ca&category=passport'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.filters).toEqual({ country: 'CA', category: 'passport' });
    expect(body.count).toBeGreaterThan(0);
    expect(body.presets.every((preset: { country: string; documentType: string }) =>
      preset.country === 'CA' && preset.documentType === 'passport'
    )).toBe(true);
  });

  it('rejects unsupported country values', async () => {
    const response = GET(request('/api/presets?country=ZZ'));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toEqual(
      expect.objectContaining({
        code: 'UNSUPPORTED_FILTER_VALUE',
        field: 'country',
        value: 'ZZ',
      })
    );
  });

  it('rejects unsupported category values', async () => {
    const response = GET(request('/api/presets?category=selfie'));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toEqual(
      expect.objectContaining({
        code: 'UNSUPPORTED_FILTER_VALUE',
        field: 'category',
        value: 'selfie',
      })
    );
  });

  it('rejects image payload query parameters instead of processing them', async () => {
    const response = GET(request('/api/presets?imageUrl=https%3A%2F%2Fexample.test%2Fphoto.jpg'));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toEqual(
      expect.objectContaining({
        code: 'UNSUPPORTED_QUERY_PARAMETER',
        field: 'imageUrl',
      })
    );
  });
});
