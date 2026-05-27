import type { NextConfig } from 'next';

/**
 * Content Security Policy for privacy-first client-only image processing.
 * 
 * Restrictions:
 * - default-src 'self': Only same-origin resources by default
 * - script-src 'self': No inline scripts, only self-hosted scripts
 * - style-src 'self' 'unsafe-inline': Allow inline styles for Tailwind/shadcn
 * - img-src 'self' blob: data:: Only local images, blobs, and data URIs - NO remote images
 * - connect-src 'self': No external API calls
 * - worker-src 'self' blob:: Allow web workers from same origin and blob URLs
 * - child-src 'self' blob:: Same as worker-src for iframes/workers
 * - object-src 'none': No plugins
 * - base-uri 'self': Prevent base tag injection
 * - form-action 'self': Prevent form hijacking
 * - frame-ancestors 'none': Prevent clickjacking
 * - upgrade-insecure-requests: Force HTTPS
 */
const CSP_HEADER = [
  "default-src 'self'",
  // Allow unsafe-inline for styles due to Tailwind CSS-in-JS usage
  "style-src 'self' 'unsafe-inline'",
  // Only local scripts - no external scripts
  "script-src 'self'",
  // NO arbitrary remote images - only same-origin, blob (object URLs), and data URIs
  "img-src 'self' blob: data:",
  // No external connections - everything is client-side
  "connect-src 'self'",
  // Allow workers for image processing (same-origin and blob URLs only)
  "worker-src 'self' blob:",
  "child-src 'self' blob:",
  // No plugins
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  // Prevent embedding in iframes (clickjacking protection)
  "frame-ancestors 'none'",
  // Enforce HTTPS
  "upgrade-insecure-requests",
].join('; ');

const nextConfig: NextConfig = {
  reactStrictMode: true,
  
  async headers() {
    return [
      {
        // Apply CSP to all routes
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: CSP_HEADER,
          },
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
        ],
      },
    ];
  },
};

export default nextConfig;
