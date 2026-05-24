import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const res = NextResponse.next();
  // Set CSP header to allow WASM loading
  res.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self'; worker-src 'self'; connect-src 'self'; img-src 'self'; style-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none';"
  );
  return res;
}
