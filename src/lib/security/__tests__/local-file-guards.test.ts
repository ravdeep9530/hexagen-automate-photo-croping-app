import { describe, it, expect, vi } from 'vitest';
import {
  isLocalFile,
  rejectRemoteUrl,
  validateLocalFileInput,
  assertLocalFileOrThrow,
  isObjectURL,
  isDataURI,
  isRemoteUrl,
  type FileOrRejected,
} from '../local-file-guards';

describe('isLocalFile', () => {
  it('returns true for valid File objects from file input', () => {
    const file = new File(['test'], 'photo.jpg', { type: 'image/jpeg' });
    expect(isLocalFile(file)).toBe(true);
  });

  it('returns true for File objects with blob: origin', () => {
    const file = new File(['test'], 'photo.png', { type: 'image/png' });
    Object.defineProperty(file, 'name', { value: 'blob:photo.png', configurable: true });
    expect(isLocalFile(file)).toBe(true);
  });

  it('returns false for URL strings', () => {
    expect(isLocalFile('https://example.com/photo.jpg')).toBe(false);
    expect(isLocalFile('http://example.com/photo.jpg')).toBe(false);
  });

  it('returns false for null and undefined', () => {
    expect(isLocalFile(null)).toBe(false);
    expect(isLocalFile(undefined)).toBe(false);
  });

  it('returns false for non-File objects', () => {
    expect(isLocalFile({ name: 'photo.jpg' })).toBe(false);
    expect(isLocalFile([1, 2, 3])).toBe(false);
    expect(isLocalFile(new Blob(['test']))).toBe(false);
  });
});

describe('rejectRemoteUrl', () => {
  it('returns safe for valid File objects', () => {
    const file = new File(['test'], 'photo.jpg', { type: 'image/jpeg' });
    const result = rejectRemoteUrl(file);
    expect(result.type).toBe('safe');
    if (result.type === 'safe') {
      expect(result.file).toBe(file);
    }
  });

  it('returns error for https URLs', () => {
    const result = rejectRemoteUrl('https://example.com/photo.jpg');
    expect(result.type).toBe('error');
    if (result.type === 'error') {
      expect(result.reason).toBe('Remote URLs are not supported for privacy. Please upload a local file.');
    }
  });

  it('returns error for http URLs', () => {
    const result = rejectRemoteUrl('http://malicious.com/photo.png');
    expect(result.type).toBe('error');
    if (result.type === 'error') {
      expect(result.reason).toContain('Remote URLs');
    }
  });

  it('returns error for ftp URLs', () => {
    const result = rejectRemoteUrl('ftp://example.com/photo.jpg');
    expect(result.type).toBe('error');
    if (result.type === 'error') {
      expect(result.reason).toContain('Remote URLs');
    }
  });

  it('returns error for null/undefined with descriptive message', () => {
    const nullResult = rejectRemoteUrl(null);
    const undefResult = rejectRemoteUrl(undefined);
    
    expect(nullResult.type).toBe('error');
    expect(undefResult.type).toBe('error');
    
    if (nullResult.type === 'error') {
      expect(nullResult.reason).toBe('No file provided. Please select a local file.');
    }
  });

  it('allows blob URLs returned as error (CSAM/privacy concern)', () => {
    // blob: URLs are object URLs and shouldn't be accepted from user input
    // They should be treated as potentially unsafe
    const blobUrl = 'blob:https://example.com/abc123';
    const result = rejectRemoteUrl(blobUrl);
    expect(result.type).toBe('error');
  });
});

describe('validateLocalFileInput', () => {
  it('returns valid Files for all local File inputs', () => {
    const files = [
      new File(['test'], 'photo1.jpg', { type: 'image/jpeg' }),
      new File(['test2'], 'photo2.png', { type: 'image/png' }),
    ];
    
    const result = validateLocalFileInput(files);
    expect(result.valid.length).toBe(2);
    expect(result.rejected.length).toBe(0);
    expect(result.valid[0].type).toBe('safe');
  });

  it('rejects remote URLs and collects errors', () => {
    const mixed = [
      new File(['test'], 'photo.jpg', { type: 'image/jpeg' }),
      'https://example.com/remote.jpg',
      'http://evil.com/photo.png',
    ] as unknown[];
    
    const result = validateLocalFileInput(mixed);
    expect(result.valid.length).toBe(1);
    expect(result.rejected.length).toBe(2);
  });

  it('handles empty array', () => {
    const result = validateLocalFileInput([]);
    expect(result.valid.length).toBe(0);
    expect(result.rejected.length).toBe(0);
  });

  it('rejects non-File, non-URL objects', () => {
    const invalid = [{ name: 'fake.jpg' }, null, undefined];
    const result = validateLocalFileInput(invalid as unknown[]);
    expect(result.valid.length).toBe(0);
    expect(result.rejected.length).toBe(3);
  });
});

describe('assertLocalFileOrThrow', () => {
  it('returns File for valid local File', () => {
    const file = new File(['test'], 'photo.jpg', { type: 'image/jpeg' });
    expect(assertLocalFileOrThrow(file)).toBe(file);
  });

  it('throws for remote URLs', () => {
    expect(() => assertLocalFileOrThrow('https://example.com/photo.jpg')).toThrow(
      'Remote URLs are not supported'
    );
  });

  it('throws for null/undefined', () => {
    expect(() => assertLocalFileOrThrow(null)).toThrow('No file provided');
    expect(() => assertLocalFileOrThrow(undefined)).toThrow('No file provided');
  });

  it('throws for non-File objects', () => {
    expect(() => assertLocalFileOrThrow({ name: 'fake.jpg' })).toThrow('Invalid file input');
  });
});

describe('isObjectURL', () => {
  it('returns true for blob: URLs', () => {
    expect(isObjectURL('blob:https://example.com/abc123')).toBe(true);
    expect(isObjectURL('blob:null/abc123')).toBe(true);
  });

  it('returns false for http/https URLs', () => {
    expect(isObjectURL('https://example.com/photo.jpg')).toBe(false);
    expect(isObjectURL('http://example.com/photo.jpg')).toBe(false);
  });

  it('returns false for data URIs', () => {
    expect(isObjectURL('data:image/jpeg;base64,abc123')).toBe(false);
  });

  it('returns false for non-strings', () => {
    expect(isObjectURL(null)).toBe(false);
    expect(isObjectURL(undefined)).toBe(false);
    expect(isObjectURL(123)).toBe(false);
  });
});

describe('isDataURI', () => {
  it('returns true for data URIs', () => {
    expect(isDataURI('data:image/jpeg;base64,abc123')).toBe(true);
    expect(isDataURI('data:text/plain,Hello')).toBe(true);
  });

  it('returns false for blob URLs', () => {
    expect(isDataURI('blob:https://example.com/abc123')).toBe(false);
  });

  it('returns false for http/https URLs', () => {
    expect(isDataURI('https://example.com/photo.jpg')).toBe(false);
  });

  it('returns false for non-strings', () => {
    expect(isDataURI(null)).toBe(false);
    expect(isDataURI(new File(['x'], 'y'))).toBe(false);
  });
});

describe('isRemoteUrl', () => {
  it('returns true for http and https URLs', () => {
    expect(isRemoteUrl('https://example.com/photo.jpg')).toBe(true);
    expect(isRemoteUrl('http://example.com/photo.png')).toBe(true);
    expect(isRemoteUrl('HTTPS://EXAMPLE.COM/photo.jpg')).toBe(true);
    expect(isRemoteUrl('HTTP://LOCALHOST:3000/photo.jpg')).toBe(true);
  });

  it('returns true for ftp URLs', () => {
    expect(isRemoteUrl('ftp://example.com/photo.jpg')).toBe(true);
  });

  it('returns false for relative URLs', () => {
    expect(isRemoteUrl('/assets/photo.jpg')).toBe(false);
    expect(isRemoteUrl('photo.jpg')).toBe(false);
  });

  it('returns false for blob: URLs', () => {
    expect(isRemoteUrl('blob:https://example.com/abc123')).toBe(false);
  });

  it('returns false for data: URIs', () => {
    expect(isRemoteUrl('data:image/jpeg;base64,abc')).toBe(false);
  });

  it('returns false for non-strings', () => {
    expect(isRemoteUrl(null)).toBe(false);
    expect(isRemoteUrl(undefined)).toBe(false);
    expect(isRemoteUrl(new File(['x'], 'y'))).toBe(false);
  });

  it('returns false for javascript: URLs (XSS vector)', () => {
    expect(isRemoteUrl('javascript:alert(1)')).toBe(false);
  });
});
