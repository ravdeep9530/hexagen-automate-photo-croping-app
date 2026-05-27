/**
 * Content Security Policy Module
 * 
 * Generates restrictive CSP headers for a privacy-first, client-only image app.
 * 
 * Security considerations:
 * - No remote images: img-src restricted to 'self', blob:, and data:
 * - No remote scripts: script-src restricted to 'self'
 * - No external connections: connect-src restricted to 'self'
 * - Workers allowed for image processing: worker-src 'self' blob:
 * - WASM allowed for AI models: included in script-src 'self'
 */

export interface CSPDirective {
  directive: string;
  values: string[];
}

export interface CSPConfig {
  directives: CSPDirective[];
  reportOnly?: boolean;
  reportUri?: string;
}

/**
 * Default restrictive CSP for the photo editor app.
 * 
 * Key restrictions:
 * - No arbitrary remote image uploads - only local files via blob/data
 * - No external scripts or styles
 * - No external connections
 * - Workers allowed for processing (same-origin and blob: only)
 */
export const RESTRICTIVE_CSP: CSPConfig = {
  directives: [
    { directive: 'default-src', values: ["'self'"] },
    { directive: 'script-src', values: ["'self'", "'wasm-unsafe-eval'"] },
    { directive: 'style-src', values: ["'self'", "'unsafe-inline'"] },
    // CRITICAL: img-src only allows local-origin, blob (object URLs), and data URIs
    // NO remote images allowed - this prevents:
    // - CSRF/leakage via image sources
    // - Canvas tainting issues
    // - Privacy violations from external image requests
    { directive: 'img-src', values: ["'self'", "blob:", "data:"] },
    // No external connections - everything is client-side
    { directive: 'connect-src', values: ["'self'"] },
    // Workers allowed for image processing (same-origin and blob URLs)
    // blob: required for dynamically created worker code
    { directive: 'worker-src', values: ["'self'", "blob:"] },
    // Same as worker-src for iframes/workers
    { directive: 'child-src', values: ["'self'", "blob:"] },
    // No plugins (Flash, Java, etc.)
    { directive: 'object-src', values: ["'none'"] },
    // Prevent base tag injection attacks
    { directive: 'base-uri', values: ["'self'"] },
    // Prevent form submission hijacking
    { directive: 'form-action', values: ["'self'"] },
    // Prevent embedding in iframes (clickjacking)
    { directive: 'frame-ancestors', values: ["'none'"] },
    // Upgrade all HTTP to HTTPS
    { directive: 'upgrade-insecure-requests', values: [] },
  ],
};

/**
 * More permissive CSP for development environments.
 * Includes 'unsafe-eval' for hot reloading and dev tools.
 */
export const DEVELOPMENT_CSP: CSPConfig = {
  directives: [
    { directive: 'default-src', values: ["'self'"] },
    { directive: 'script-src', values: ["'self'", "'unsafe-eval'", "'wasm-unsafe-eval'"] },
    { directive: 'style-src', values: ["'self'", "'unsafe-inline'"] },
    { directive: 'img-src', values: ["'self'", "blob:", "data:", "https:"] },
    { directive: 'connect-src', values: ["'self'"] },
    { directive: 'worker-src', values: ["'self'", "blob:"] },
    { directive: 'child-src', values: ["'self'", "blob:"] },
    { directive: 'object-src', values: ["'none'"] },
    { directive: 'base-uri', values: ["'self'"] },
    { directive: 'form-action', values: ["'self'"] },
    { directive: 'frame-ancestors', values: ["'none'"] },
  ],
};

/**
 * Build a CSP header value from a config
 */
export function buildCSPHeader(config: CSPConfig): string {
  const parts: string[] = [];
  
  for (const { directive, values } of config.directives) {
    if (values.length === 0) {
      parts.push(directive);
    } else {
      parts.push(`${directive} ${values.join(' ')}`);
    }
  }
  
  return parts.join('; ');
}

/**
 * Build filtered CSP for API routes that don't need full processing
 */
export function buildMinimalCSP(): string {
  return [
    "default-src 'none'",
    "script-src 'none'",
    "style-src 'none'",
    "img-src 'none'",
    "connect-src 'none'",
    "frame-ancestors 'none'",
  ].join('; ');
}

/**
 * Get CSP header name based on configuration
 */
export function getCSPHeaderName(config: CSPConfig): string {
  return config.reportOnly
    ? 'Content-Security-Policy-Report-Only'
    : 'Content-Security-Policy';
}

/**
 * Validate that a URL would be allowed by the CSP img-src directive
 * This is a client-side guard to provide early feedback before browser enforcement
 */
export function isCSPCompliantImageSource(url: string): boolean {
  // Allow relative URLs (same origin)
  if (!url.includes(':') || url.startsWith('/')) {
    return true;
  }
  
  try {
    const lowerUrl = url.toLowerCase().trim();
    
    // Allow blob URLs (object URLs for local files)
    if (lowerUrl.startsWith('blob:')) {
      return true;
    }
    
    // Allow data URIs (canvas exports)
    if (lowerUrl.startsWith('data:')) {
      return true;
    }
    
    // Reject all other protocols
    // http: and https: are NOT allowed by restrictive CSP
    return false;
  } catch {
    return false;
  }
}

/**
 * Security headers configuration for Next.js
 * Compatible with the headers() export in next.config.ts
 */
export const SECURITY_HEADERS = [
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  },
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'off',
  },
  {
    key: 'Cross-Origin-Embedder-Policy',
    value: 'require-corp',
  },
  {
    key: 'Cross-Origin-Opener-Policy',
    value: 'same-origin',
  },
  {
    key: 'Cross-Origin-Resource-Policy',
    value: 'same-origin',
  },
];

/**
 * Get all security headers including CSP
 */
export function getAllSecurityHeaders(isDevelopment = false): { key: string; value: string }[] {
  const cspConfig = isDevelopment ? DEVELOPMENT_CSP : RESTRICTIVE_CSP;
  
  return [
    {
      key: getCSPHeaderName(cspConfig),
      value: buildCSPHeader(cspConfig),
    },
    ...SECURITY_HEADERS,
  ];
}

export default {
  RESTRICTIVE_CSP,
  DEVELOPMENT_CSP,
  buildCSPHeader,
  buildMinimalCSP,
  getCSPHeaderName,
  isCSPCompliantImageSource,
  getAllSecurityHeaders,
};
