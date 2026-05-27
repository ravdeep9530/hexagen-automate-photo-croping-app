import { describe, expect, it } from 'vitest';
import { GET } from '../health/route';

describe('GET /api/health', () => {
  it('returns status, version, and commit fields', async () => {
    const response = GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      status: 'healthy',
      version: expect.any(String),
      commit: expect.any(String),
    });
    expect(body.version).toMatch(/^\d{4}\.\d+\.\d+$/);
  });
});
