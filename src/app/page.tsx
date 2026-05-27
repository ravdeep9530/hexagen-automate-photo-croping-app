import React from 'react';
import type { Metadata } from 'next';
import { HeroSection } from '@/components/marketing/hero-section';
import { getAllPresets } from '@/data/catalog';

export const metadata: Metadata = {
  title: 'Hexagen Photo | Create Perfect Passport & Visa Photos',
  description:
    'Transform your photos into government-compliant passport and visa photos. 100% local browser processing—your photos never leave your device.',
  keywords: ['passport photo', 'visa photo', 'photo cropping', 'privacy-first', 'local processing'],
  openGraph: {
    title: 'Hexagen Photo | Create Perfect Passport & Visa Photos',
    description: 'Privacy-first passport and visa photo preparation. No uploads, 100% browser-based.',
    type: 'website',
  },
};

/**
 * Home page - Landing page for the photo cropping application.
 *
 * Communicates:
 * - Local browser processing (privacy-first)
 * - No photo upload to servers
 * - Supported document types (passports, visas, ID cards)
 * - Call-to-action to the editor
 */
export default function HomePage(): React.JSX.Element {
  const presets = getAllPresets();
  const presetCount = presets.length;

  // For now, we render a landing page without editor navigation
  // Client-side navigation can be added when the editor route exists
  const handleStartEditing = () => {
    // This would navigate to the editor
    // In a real implementation with client interactivity, use router.push('/editor')
    if (typeof window !== 'undefined') {
      window.location.href = '/presets';
    }
  };

  return (
    <main className="min-h-screen">
      <HeroSection
        onStartEditing={handleStartEditing}
        presetCount={presetCount}
      />

      {/* Additional Marketing Sections */}
      <section className="w-full py-16 bg-muted/30">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold mb-4">Why Choose Hexagen Photo?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Government photo requirements are strict and vary by country.
              We provide accurate, up-to-date specifications validated against official sources.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <ValuePropCard
              title="Official Specifications"
              description="Presets based on official government requirements from Canada, USA, India, and more."
            />
            <ValuePropCard
              title="Built-in Validation"
              description="Automated checks for dimensions, file size, and facial positioning where detectable."
            />
            <ValuePropCard
              title="Privacy by Design"
              description="Your biometric photos and personal images never leave your browser."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full py-16">
        <div className="container px-4 md:px-6 mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to create your photo?</h2>
          <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
            Browse our catalog of {presetCount} official presets or jump right into the editor.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/presets">
              <button className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-8">
                Browse Presets
              </button>
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}

function ValuePropCard({
  title,
  description,
}: {
  title: string;
  description: string;
}): React.JSX.Element {
  return (
    <div className="flex flex-col items-center">
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm">{description}</p>
    </div>
  );
}
