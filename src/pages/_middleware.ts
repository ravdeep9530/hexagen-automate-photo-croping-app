import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const res = NextResponse.next();
  // Set CSP headers for WASM loading
  res.headers.set('Content-Security-Policy', "default-src 'self'; script-src 'self'; worker-src 'self'; object-src 'none'; connect-src 'self'; img-src 'self'; style-src 'self'; frame-src 'none';");
  return res;
}
