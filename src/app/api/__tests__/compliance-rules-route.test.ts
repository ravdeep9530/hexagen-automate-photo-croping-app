import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '../compliance-rules/route';

function request(path: string): NextRequest {
  return new NextRequest(`https://example.test${path}`);
}

describe('GET /api/compliance-rules', () => {
  it('returns validated compliance rules', async () => {
    const response = GET(request('/api/compliance-rules'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.version).toMatch(/^\d{4}\.\d+\.\d+$/);
    expect(body.count).toBeGreaterThan(0);
    expect(body.rulesets).toHaveLength(body.count);
    expect(body.rulesets[0]).toEqual(
      expect.objectContaining({
        presetId: expect.any(String),
        rules: expect.any(Array),
        version: expect.any(String),
      })
    );
  });

  it('supports presetId filtering', async () => {
    const response = GET(request('/api/compliance-rules?presetId=us-passport-2x2'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.filters).toEqual({ presetId: 'us-passport-2x2' });
    expect(body.count).toBe(1);
    expect(body.rulesets[0].presetId).toBe('us-passport-2x2');
  });

  it('supports country filtering', async () => {
    const response = GET(request('/api/compliance-rules?country=in'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.filters).toEqual({ country: 'IN' });
    expect(body.count).toBeGreaterThan(0);
    expect(body.rulesets.every((ruleset: { presetId: string }) => ruleset.presetId.startsWith('in-'))).toBe(true);
  });

  it('rejects unsupported presetId values', async () => {
    const response = GET(request('/api/compliance-rules?presetId=unknown-preset'));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toEqual(
      expect.objectContaining({
        code: 'UNSUPPORTED_FILTER_VALUE',
        field: 'presetId',
        value: 'unknown-preset',
      })
    );
  });

  it('rejects unsupported country values', async () => {
    const response = GET(request('/api/compliance-rules?country=ZZ'));
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

  it('rejects remote image URL query parameters instead of processing them', async () => {
    const response = GET(request('/api/compliance-rules?remoteImageUrl=https%3A%2F%2Fexample.test%2Fphoto.jpg'));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toEqual(
      expect.objectContaining({
        code: 'UNSUPPORTED_QUERY_PARAMETER',
        field: 'remoteImageUrl',
      })
    );
  });
});
