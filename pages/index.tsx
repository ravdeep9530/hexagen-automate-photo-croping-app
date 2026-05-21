import React from 'react';

export default function Home() {
  return (
    <main style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 80 }}>
      <h1>Welcome to Shadcn Next.js App</h1>
      <p>The app is running with pnpm and shadcn UI components.</p>
      <button style={{ padding: '8px 16px', background: '#111', color: '#fff', border: 'none', borderRadius: 4 }}>Shadcn Button</button>
    </main>
  );
}
