import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();

describe('SDLC-100 project foundation', () => {
  it('creates the required directories', () => {
    expect(existsSync(join(root, 'src/components'))).toBe(true);
    expect(existsSync(join(root, 'src/lib'))).toBe(true);
    expect(existsSync(join(root, 'src/types'))).toBe(true);
    expect(existsSync(join(root, 'src/app/api'))).toBe(true);
  });

  it('defines docker defaults for the Next.js app', () => {
    const dockerfile = readFileSync(join(root, 'Dockerfile'), 'utf8');
    const dockerignore = readFileSync(join(root, '.dockerignore'), 'utf8');

    expect(dockerfile).toContain('FROM node:18-alpine');
    expect(dockerfile).toContain('EXPOSE 3000');
    expect(dockerfile).toContain('CMD ["npx", "next", "dev", "-p", "3000"]');
    expect(dockerignore).toContain('node_modules');
    expect(dockerignore).toContain('.next');
    expect(dockerignore).toContain('test-results');
  });

  it('renders the placeholder home page copy without server-only hazards', () => {
    const page = readFileSync(join(root, 'src/app/page.tsx'), 'utf8');
    const layout = readFileSync(join(root, 'src/app/layout.tsx'), 'utf8');

    expect(page).toContain('Photo Crop App');
    expect(page).toContain('export default function');
    expect(layout).toContain('<html lang="en">');
    expect(layout).toContain('<body>{children}</body>');
    expect(layout).not.toContain('next/document');
  });
});
