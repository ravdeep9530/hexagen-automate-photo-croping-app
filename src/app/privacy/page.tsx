import React from 'react';
import type { Metadata } from 'next';
import { PrivacyFeatureGrid } from '@/components/marketing/privacy-feature-grid';

export const metadata: Metadata = {
  title: 'Privacy Policy | Hexagen Photo',
  description:
    'Learn how Hexagen Photo processes your photos entirely in your browser. No uploads, no cloud storage—complete privacy for your passport and visa photos.',
  keywords: ['privacy', 'local processing', 'data protection', 'no uploads', 'secure photos'],
};

/**
 * Privacy page - Explains local processing and data controls.
 *
 * Key messages:
 * - All photo processing happens locally in the browser
 * - No photo data is uploaded to servers
 * - Users have full control over their local data
 * - Clear local data action is available
 */
export default function PrivacyPage(): React.JSX.Element {
  return (
    <main className="min-h-screen">
      <div className="w-full py-12 md:py-16 bg-muted/30">
        <div className="container px-4 md:px-6 mx-auto max-w-4xl">
          {/* Page Header */}
          <div className="mb-12">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Privacy Policy
            </h1>
            <p className="text-lg text-muted-foreground">
              Your privacy is our foundation. We designed Hexagen Photo so your sensitive
              passport and visa photos never need to leave your device.
            </p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <SummaryCard
              value="100%"
              label="Browser Processing"
              description="All photo editing runs locally"
            />
            <SummaryCard
              value="Zero"
              label="Photo Uploads"
              description="Your images never travel to our servers"
            />
            <SummaryCard
              value="Full"
              label="User Control"
              description="Clear your data anytime"
            />
          </div>
        </div>
      </div>

      <PrivacyFeatureGrid />

      {/* Policy Details */}
      <section className="w-full py-12 md:py-16">
        <div className="container px-4 md:px-6 mx-auto max-w-4xl space-y-8">
          <h2 className="text-2xl font-bold">Detailed Information</h2>

          <PolicySection title="Information We Process">
            <p>
              Hexagen Photo operates entirely within your web browser. When you use our application,
              the following happens:
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-3">
              <li>
                <strong>Photo Selection:</strong> You select photos from your device. These files
                are accessed via the browser&apos;s File API and loaded into browser memory.
              </li>
              <li>
                <strong>Image Processing:</strong> All cropping, resizing, background manipulation,
                and validation happens using HTML5 Canvas or OffscreenCanvas APIs.
              </li>
              <li>
                <strong>Data Storage:</strong> Only lightweight preferences (theme, last preset)
                are stored locally using browser storage APIs. Your actual photo images are never
                persisted unless you explicitly save an export.
              </li>
              <li>
                <strong>No Transmission:</strong> At no point are your images sent to our servers
                or any third party.
              </li>
            </ul>
          </PolicySection>

          <PolicySection title="Local Data Controls">
            <p>
              You maintain complete control over your data in the Hexagen Photo application:
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-3">
              <li>
                <strong>Clear Preferences:</strong> Use the Clear Local Data action to remove
                all stored settings and preferences instantly.
              </li>
              <li>
                <strong>No Account Required:</strong> We don&apos;t require user accounts,
                so there is no cloud-stored profile to manage.
              </li>
              <li>
                <strong>Session-Based:</strong> Photo processing is session-based. When you
                close the application or clear your browser data, all processing state is reset.
              </li>
            </ul>
          </PolicySection>

          <PolicySection title="Technical Implementation">
            <p>
              Our privacy-first architecture is achieved through modern web technologies:
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-3">
              <li>Client-side JavaScript for all image manipulation</li>
              <li>Canvas API for pixel-level image operations</li>
              <li>Web Workers for background processing (where supported)</li>
              <li>LocalStorage/IndexedDB only for non-sensitive preferences</li>
              <li>Service Worker for offline capability (no data sync)</li>
            </ul>
          </PolicySection>

          <PolicySection title="Changes to This Policy">
            <p>
              We may update this privacy policy to reflect changes in our practices or for legal
              reasons. Any changes will be posted on this page with an updated revision date.
              We will not reduce your privacy rights without providing notice.
            </p>
          </PolicySection>

          <PolicySection title="Contact">
            <p>
              If you have questions about this privacy policy or our data practices,
              please contact us through the appropriate channels provided in the application.
            </p>
          </PolicySection>

          <div className="text-sm text-muted-foreground pt-8 border-t">
            <p>Last updated: June 2024</p>
          </div>
        </div>
      </section>
    </main>
  );
}

interface SummaryCardProps {
  value: string;
  label: string;
  description: string;
}

function SummaryCard({ value, label, description }: SummaryCardProps): React.JSX.Element {
  return (
    <div className="rounded-lg border bg-card p-6 text-center">
      <div className="text-4xl font-bold text-primary mb-1">{value}</div>
      <div className="font-semibold">{label}</div>
      <div className="text-sm text-muted-foreground mt-1">{description}</div>
    </div>
  );
}

interface PolicySectionProps {
  title: string;
  children: React.ReactNode;
}

function PolicySection({ title, children }: PolicySectionProps): React.JSX.Element {
  return (
    <section>
      <h3 className="text-lg font-semibold mb-3">{title}</h3>
      <div className="text-muted-foreground leading-relaxed">{children}</div>
    </section>
  );
}
