import { describe, it, expect } from 'vitest';
import {
  RESTRICTIVE_CSP,
  DEVELOPMENT_CSP,
  buildCSPHeader,
  buildMinimalCSP,
  isCSPCompliantImageSource,
  getAllSecurityHeaders,
  getCSPHeaderName,
  type CSPDirective,
} from '../csp';

describe('Content Security Policy (CSP)', () => {
  describe('RESTRICTIVE_CSP', () => {
    it('has default-src restricted to self', () => {
      const directive = RESTRICTIVE_CSP.directives.find(d => d.directive === 'default-src');
      expect(directive?.values).toContain("'self'");
    });

    it('has script-src restricted to self with wasm support', () => {
      const directive = RESTRICTIVE_CSP.directives.find(d => d.directive === 'script-src');
      expect(directive?.values).toContain("'self'");
      expect(directive?.values).toContain("'wasm-unsafe-eval'");
    });

    it('has style-src allowing self and unsafe-inline (needed for Tailwind CSS)', () => {
      const directive = RESTRICTIVE_CSP.directives.find(d => d.directive === 'style-src');
      expect(directive?.values).toContain("'self'");
      expect(directive?.values).toContain("'unsafe-inline'");
    });

    it('has img-src restricted to self, blob, and data (NO remote images)', () => {
      const directive = RESTRICTIVE_CSP.directives.find(d => d.directive === 'img-src');
      expect(directive?.values).toContain("'self'");
      expect(directive?.values).toContain('blob:');
      expect(directive?.values).toContain('data:');
      expect(directive?.values).not.toContain('https:');
      expect(directive?.values).not.toContain('http:');
      expect(directive?.values).not.toContain('*');
    });

    it('has connect-src restricted to self (no external API calls)', () => {
      const directive = RESTRICTIVE_CSP.directives.find(d => d.directive === 'connect-src');
      expect(directive?.values).toEqual(["'self'"]);
    });

    it('has worker-src allowing self and blob (for image processing workers)', () => {
      const directive = RESTRICTIVE_CSP.directives.find(d => d.directive === 'worker-src');
      expect(directive?.values).toContain("'self'");
      expect(directive?.values).toContain('blob:');
    });

    it('has child-src allowing self and blob (for workers/iframes)', () => {
      const directive = RESTRICTIVE_CSP.directives.find(d => d.directive === 'child-src');
      expect(directive?.values).toContain("'self'");
      expect(directive?.values).toContain('blob:');
    });

    it('has object-src set to none (no plugins)', () => {
      const directive = RESTRICTIVE_CSP.directives.find(d => d.directive === 'object-src');
      expect(directive?.values).toContain("'none'");
    });

    it('has frame-ancestors set to none (clickjacking protection)', () => {
      const directive = RESTRICTIVE_CSP.directives.find(d => d.directive === 'frame-ancestors');
      expect(directive?.values).toContain("'none'");
    });

    it('includes upgrade-insecure-requests directive', () => {
      const directive = RESTRICTIVE_CSP.directives.find(d => d.directive === 'upgrade-insecure-requests');
      expect(directive).toBeDefined();
      expect(directive?.values).toEqual([]);
    });
  });

  describe('buildCSPHeader', () => {
    it('builds a valid CSP header string from config', () => {
      const header = buildCSPHeader(RESTRICTIVE_CSP);
      
      expect(header).toContain("default-src 'self'");
      expect(header).toContain("script-src 'self'");
      expect(header).toContain("img-src 'self' blob: data:");
      expect(header).toContain("connect-src 'self'");
    });

    it('includes all directives separated by semicolons', () => {
      const header = buildCSPHeader(RESTRICTIVE_CSP);
      const parts = header.split('; ');
      
      expect(parts.length).toBeGreaterThanOrEqual(RESTRICTIVE_CSP.directives.length - 1);
      
      // Directives with values should have space after directive name
      expect(parts.some(p => p.includes("img-src 'self'"))).toBe(true);
    });

    it('handles directives without values (like upgrade-insecure-requests)', () => {
      const config: { directives: CSPDirective[] } = {
        directives: [
          { directive: 'upgrade-insecure-requests', values: [] },
          { directive: 'default-src', values: ["'self'"] },
        ],
      };
      
      const header = buildCSPHeader(config);
      
      expect(header).toContain('upgrade-insecure-requests');
      expect(header).not.toContain('upgrade-insecure-requests ');
    });
  });

  describe('buildMinimalCSP', () => {
    it('returns a minimal CSP with all sources denied', () => {
      const header = buildMinimalCSP();
      
      expect(header).toContain("default-src 'none'");
      expect(header).toContain("script-src 'none'");
      expect(header).toContain("img-src 'none'");
      expect(header).toContain("connect-src 'none'");
      expect(header).toContain("frame-ancestors 'none'");
    });
  });

  describe('isCSPCompliantImageSource', () => {
    it('allows relative URLs (same origin)', () => {
      expect(isCSPCompliantImageSource('/assets/photo.jpg')).toBe(true);
      expect(isCSPCompliantImageSource('assets/photo.jpg')).toBe(true);
    });

    it('allows blob URLs (object URLs for local files)', () => {
      expect(isCSPCompliantImageSource('blob:https://example.com/abc123')).toBe(true);
      expect(isCSPCompliantImageSource('blob:null/uuid')).toBe(true);
    });

    it('allows data URIs (canvas exports)', () => {
      expect(isCSPCompliantImageSource('data:image/jpeg;base64,abc123')).toBe(true);
      expect(isCSPCompliantImageSource('data:text/plain,Hello')).toBe(true);
    });

    it('REJECTS remote HTTPS URLs (privacy requirement)', () => {
      expect(isCSPCompliantImageSource('https://example.com/photo.jpg')).toBe(false);
      expect(isCSPCompliantImageSource('HTTPS://EXAMPLE.COM/photo.png')).toBe(false);
    });

    it('REJECTS remote HTTP URLs (security risk)', () => {
      expect(isCSPCompliantImageSource('http://example.com/photo.jpg')).toBe(false);
    });

    it('handles edge cases', () => {
      expect(isCSPCompliantImageSource('')).toBe(true); // Empty/relative treated as safe
      expect(isCSPCompliantImageSource('   ')).toBe(true); // Whitespace only
    });
  });

  describe('getCSPHeaderName', () => {
    it('returns standard header name for non-report-only CSP', () => {
      const name = getCSPHeaderName({ directives: [], reportOnly: false });
      expect(name).toBe('Content-Security-Policy');
    });

    it('returns report-only header name when reportOnly is true', () => {
      const name = getCSPHeaderName({ directives: [], reportOnly: true });
      expect(name).toBe('Content-Security-Policy-Report-Only');
    });
  });

  describe('getAllSecurityHeaders', () => {
    it('includes CSP header as first header', () => {
      const headers = getAllSecurityHeaders();
      expect(headers[0]?.key).toBe('Content-Security-Policy');
    });

    it('includes all defense-in-depth headers', () => {
      const headers = getAllSecurityHeaders();
      const keys = headers.map(h => h.key);
      
      expect(keys).toContain('X-Content-Type-Options');
      expect(keys).toContain('X-Frame-Options');
      expect(keys).toContain('X-XSS-Protection');
      expect(keys).toContain('Referrer-Policy');
      expect(keys).toContain('Permissions-Policy');
      expect(keys).toContain('X-DNS-Prefetch-Control');
      expect(keys).toContain('Cross-Origin-Embedder-Policy');
      expect(keys).toContain('Cross-Origin-Opener-Policy');
      expect(keys).toContain('Cross-Origin-Resource-Policy');
    });

    it('uses restrictive CSP in production mode', () => {
      const headers = getAllSecurityHeaders(false);
      const cspHeader = headers.find(h => h.key === 'Content-Security-Policy');
      
      expect(cspHeader?.value).toContain("img-src 'self' blob: data:");
      expect(cspHeader?.value).not.toContain('https:');
    });

    it('uses more permissive CSP in development mode', () => {
      const headers = getAllSecurityHeaders(true);
      const cspHeader = headers.find(h => h.key === 'Content-Security-Policy');
      
      expect(cspHeader?.value).toContain('unsafe-eval');
    });
  });
});
