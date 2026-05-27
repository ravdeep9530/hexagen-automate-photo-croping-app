import { describe, it, expect } from 'vitest';
import {
  methodNotAllowed,
  rejectUnsupportedStaticApiMethod,
  apiError,
  validateAllowedSearchParams,
  validateFilterValue,
} from '../_lib/static-api';

describe('Static API Routes - Method Restrictions', () => {
  describe('methodNotAllowed', () => {
    it('returns 405 response with correct Allow header for GET-only', () => {
      const response = methodNotAllowed(['GET']);
      
      expect(response.status).toBe(405);
      expect(response.headers.get('Allow')).toBe('GET');
    });

    it('returns 405 response with correct Allow header for multiple methods', () => {
      const response = methodNotAllowed(['GET', 'HEAD']);
      
      expect(response.status).toBe(405);
      expect(response.headers.get('Allow')).toBe('GET, HEAD');
    });

    it('includes error details in response body', async () => {
      const response = methodNotAllowed(['GET']);
      
      const body = await response.json() as unknown;
      expect(body).toMatchObject({
        error: {
          code: 'METHOD_NOT_ALLOWED',
          message: expect.stringContaining('GET'),
        },
      });
    });
  });

  describe('rejectUnsupportedStaticApiMethod', () => {
    it('is an alias for methodNotAllowed', () => {
      expect(rejectUnsupportedStaticApiMethod).toBe(methodNotAllowed);
    });
  });
});

describe('apiError utility', () => {
  it('creates error payload with required fields', () => {
    const error = apiError('UNSUPPORTED_QUERY_PARAMETER', 'Test message');
    
    expect(error).toEqual({
      error: {
        code: 'UNSUPPORTED_QUERY_PARAMETER',
        message: 'Test message',
      },
    });
  });

  it('creates error payload with optional field', () => {
    const error = apiError('UNSUPPORTED_FILTER_VALUE', 'Invalid value', {
      field: 'country',
    });
    
    expect(error).toEqual({
      error: {
        code: 'UNSUPPORTED_FILTER_VALUE',
        message: 'Invalid value',
        field: 'country',
      },
    });
  });

  it('creates error payload with both optional fields', () => {
    const error = apiError('UNSUPPORTED_FILTER_VALUE', 'Invalid value', {
      field: 'country',
      value: 'XX',
    });
    
    expect(error).toEqual({
      error: {
        code: 'UNSUPPORTED_FILTER_VALUE',
        message: 'Invalid value',
        field: 'country',
        value: 'XX',
      },
    });
  });
});

describe('validateAllowedSearchParams', () => {
  it('returns undefined for valid search params', () => {
    const params = new URLSearchParams({ country: 'CA' });
    const result = validateAllowedSearchParams(params, ['country']);
    
    expect(result).toBeUndefined();
  });

  it('returns error for unsupported params', () => {
    const params = new URLSearchParams({ unsupported: 'value' });
    const result = validateAllowedSearchParams(params, ['country']);
    
    expect(result).toBeDefined();
    expect(result?.error.code).toBe('UNSUPPORTED_QUERY_PARAMETER');
    expect(result?.error.field).toBe('unsupported');
  });

  it('returns error for image-related parameters (security)', () => {
    const imageParams = ['image', 'imageBlob', 'blob', 'file', 'photo', 'base64', 'dataUri', 'imageUrl', 'remoteImageUrl', 'url'];
    
    for (const param of imageParams) {
      const params = new URLSearchParams({ [param]: 'someValue' });
      const result = validateAllowedSearchParams(params, ['country']);
      
      expect(result).toBeDefined();
      expect(result?.error.code).toBe('UNSUPPORTED_QUERY_PARAMETER');
      expect(result?.error.field).toBe(param);
      expect(result?.error.message).toContain('image');
    }
  });
});

describe('validateFilterValue', () => {
  it('returns empty object for null/empty value', () => {
    const result = validateFilterValue('country', null, new Set(['CA', 'US']));
    
    expect(result).toEqual({});
  });

  it('returns value for valid filter', () => {
    const result = validateFilterValue('country', 'CA', new Set(['CA', 'US']));
    
    expect(result.value).toBe('CA');
    expect(result.error).toBeUndefined();
  });

  it('returns error for invalid filter value', () => {
    const result = validateFilterValue('country', 'XX', new Set(['CA', 'US']));
    
    expect(result.value).toBeUndefined();
    expect(result.error).toBeDefined();
    expect(result.error?.error.code).toBe('UNSUPPORTED_FILTER_VALUE');
    expect(result.error?.error.field).toBe('country');
    expect(result.error?.error.value).toBe('XX');
  });

  it('applies normalization function when provided', () => {
    const result = validateFilterValue(
      'country',
      'ca',
      new Set(['CA', 'US']),
      { normalize: (v) => v.toUpperCase() }
    );
    
    expect(result.value).toBe('CA');
  });
});
