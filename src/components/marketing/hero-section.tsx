'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Shield,
  FileImage,
  Globe,
  Eye,
  ArrowRight,
  Fingerprint,
  Lock,
  ScanFace,
} from 'lucide-react';

export interface HeroSectionProps {
  /** Callback for primary CTA click */
  onStartEditing?: () => void;
  /** Href for primary CTA when no callback is supplied */
  editorHref?: string;
  /** Preset count to display */
  presetCount?: number;
}

/**
 * HeroSection - Main landing section for the photo cropping app.
 */
export function HeroSection({
  onStartEditing,
  editorHref = '/presets',
  presetCount = 10,
}: HeroSectionProps): React.JSX.Element {
  const primaryCta = (
    <Button size="lg" onClick={onStartEditing} className="gap-2">
      Start Creating <ArrowRight className="h-4 w-4" />
    </Button>
  );

  return (
    <section className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-b from-background to-muted/50">
      <div className="container px-4 md:px-6 mx-auto">
        <div className="flex flex-col items-center space-y-4 text-center mb-16">
          <div className="inline-flex items-center rounded-full border px-4 py-1.5 text-sm font-medium bg-primary/5 text-primary">
            <Shield className="mr-2 h-4 w-4" />
            <span>Privacy-First Photo Processing</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl">
            Create Perfect Passport
            <br />
            <span className="text-primary">& Visa Photos</span>
          </h1>
          <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
            Transform your photos into government-compliant passport and visa photos.
            All processing happens locally in your browser—your photos never leave your device.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            {onStartEditing ? primaryCta : <a href={editorHref}>{primaryCta}</a>}
            <a href="#document-types">
              <Button size="lg" variant="outline">
                View Supported Documents
              </Button>
            </a>
          </div>
        </div>

        <div className="mx-auto grid max-w-5xl grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <Card className="relative overflow-hidden">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Lock className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">100% Local Processing</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                All photo editing, cropping, and validation happens entirely in your browser.
                No images are uploaded to any server, ever.
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <Eye className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle className="text-lg">No Photo Uploads</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Your sensitive documents and biometric photos remain on your device.
                Perfect for government ID photos where privacy matters most.
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <ScanFace className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle className="text-lg">{presetCount}+ Presets</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Ready-made templates for passports, visas, and ID cards from Canada, US, India,
                and more countries. All validated against official requirements.
              </p>
            </CardContent>
          </Card>
        </div>

        <div id="document-types" className="mt-20 text-center">
          <h2 className="text-2xl font-bold mb-8">Supported Document Types</h2>
          <div className="mx-auto flex flex-wrap justify-center gap-4 max-w-3xl">
            <DocumentTypeBadge icon={<Fingerprint />} label="Passports" />
            <DocumentTypeBadge icon={<FileImage />} label="Visas" />
            <DocumentTypeBadge icon={<Globe />} label="ID Cards" />
            <DocumentTypeBadge icon={<Shield />} label="Driver Licenses" />
            <DocumentTypeBadge icon={<Lock />} label="Permanent Residence" />
            <DocumentTypeBadge icon={<ScanFace />} label="OCI Cards" />
          </div>
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground">
            Official preset specifications for{' '}
            <span className="font-medium text-foreground">Canada</span>,{' '}
            <span className="font-medium text-foreground">United States</span>,{' '}
            <span className="font-medium text-foreground">India</span>, and more.
          </p>
        </div>
      </div>
    </section>
  );
}

function DocumentTypeBadge({ icon, label }: { icon: React.ReactElement; label: string }): React.JSX.Element {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border bg-background px-4 py-2 text-sm font-medium shadow-sm">
      {React.cloneElement(icon, { className: 'h-4 w-4 text-muted-foreground' })}
      {label}
    </div>
  );
}
