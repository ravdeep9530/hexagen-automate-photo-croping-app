import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Shield,
  Lock,
  Eye,
  Database,
  Trash2,
  FileCheck,
  ServerOff,
  HardDrive,
  Settings,
} from 'lucide-react';

/**
 * PrivacyFeatureGrid - Displays privacy and local data control features.
 *
 * Explains how the app processes photos locally and what data controls
 * users have over their information.
 */
export function PrivacyFeatureGrid(): React.JSX.Element {
  const features = [
    {
      icon: ServerOff,
      title: 'Browser-Only Processing',
      description:
        'Every step of photo preparation—from upload to export—happens entirely within your web browser. No server-side processing means zero photo transmission.',
      highlight: true,
    },
    {
      icon: Lock,
      title: 'Local File Handling',
      description:
        'When you select a photo, it stays on your device. The app uses browser File and Canvas APIs to manipulate images without ever sending data over the network.',
      highlight: false,
    },
    {
      icon: Eye,
      title: 'No Telemetry or Tracking',
      description:
        'We do not use analytics tracking pixels or telemetry on your photos. Your editing activity remains private and is not logged on external servers.',
      highlight: false,
    },
    {
      icon: HardDrive,
      title: 'Minimal Local Storage',
      description:
        'Only lightweight preferences like theme settings and last-used preset are saved locally. Actual photo images are never persisted to storage unless you explicitly export them.',
      highlight: false,
    },
    {
      icon: Trash2,
      title: 'Clear Local Data Anytime',
      description:
        'Use the built-in Clear Local Data action to immediately remove all stored preferences and session metadata. There is no cloud data to delete because we never store your photos.',
      highlight: true,
    },
    {
      icon: Settings,
      title: 'Full User Control',
      description:
        'You control your data. Export your preferences or wipe everything at any time. No accounts, no cloud sync, no hidden data retention.',
      highlight: false,
    },
  ];

  return (
    <section className="w-full py-12 md:py-16">
      <div className="container px-4 md:px-6 mx-auto max-w-6xl">
        {/* Intro Section */}
        <div className="flex flex-col items-center text-center mb-12">
          <div className="inline-flex items-center rounded-full border px-4 py-1.5 text-sm font-medium bg-primary/5 text-primary mb-4">
            <Shield className="mr-2 h-4 w-4" />
            <span>Privacy-First Architecture</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight mb-4">
            Your Photos Never Leave Your Device
          </h2>
          <p className="text-muted-foreground max-w-2xl">
            Our application is designed with privacy at its core. By leveraging modern browser
            capabilities, we eliminate the need for server-side photo processing entirely.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <PrivacyFeatureCard key={feature.title} {...feature} />
          ))}
        </div>

        {/* Technical Details */}
        <Card className="mt-12 border-primary/20 bg-primary/5">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Database className="h-6 w-6 text-primary" />
              <CardTitle>How Local Processing Works</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              When you open the photo editor, the browser initiates the following local-only workflow:
            </p>
            <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
              <li>
                <span className="font-medium text-foreground">File Selection:</span> Images are
                accessed via the File API and loaded into memory—not uploaded.
              </li>
              <li>
                <span className="font-medium text-foreground">Canvas Processing:</span> All
                cropping, resizing, and background manipulation uses HTML5 Canvas or
                OffscreenCanvas entirely within your browser.
              </li>
              <li>
                <span className="font-medium text-foreground">Validation:</span> Compliance checks
                run client-side against preset specifications stored in the application code.
              </li>
              <li>
                <span className="font-medium text-foreground">Export:</span> Final images are
                generated and downloaded directly—no round-trip to any server required.
              </li>
            </ol>
          </CardContent>
        </Card>

        {/* Data Controls Summary */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <FileCheck className="h-5 w-5 text-green-600" />
                <CardTitle className="text-lg">What We Store</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-green-600">✓</span>
                  Theme preference (light/dark mode)
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600">✓</span>
                  Last selected preset ID
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600">✓</span>
                  Editor UI preferences (optional)
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Trash2 className="h-5 w-5 text-red-600" />
                <CardTitle className="text-lg">What We Never Store</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-red-600">✗</span>
                  Your photos or image data
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-600">✗</span>
                  Face detection biometric data
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-600">✗</span>
                  Processing history or logs
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-600">✗</span>
                  Personal identification information
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}

interface PrivacyFeatureCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  highlight?: boolean;
}

function PrivacyFeatureCard({
  icon: Icon,
  title,
  description,
  highlight = false,
}: PrivacyFeatureCardProps): React.JSX.Element {
  return (
    <Card
      className={`h-full transition-shadow hover:shadow-md ${
        highlight ? 'border-primary/50 bg-primary/5' : ''
      }`}
    >
      <CardHeader>
        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded-lg ${
              highlight ? 'bg-primary/20' : 'bg-muted'
            }`}
          >
            <Icon
              className={`h-5 w-5 ${highlight ? 'text-primary' : 'text-muted-foreground'}`}
            />
          </div>
          <CardTitle className="text-base">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
      </CardContent>
    </Card>
  );
}
