import React from 'react';
import type { Metadata } from 'next';
import { AlertTriangle, CheckCircle2, XCircle, Info, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Disclaimer | Hexagen Photo',
  description:
    'Important disclaimer: Hexagen Photo provides best-effort validation guidance. Government acceptance is not guaranteed. Always verify requirements with official sources.',
  keywords: ['disclaimer', 'validation', 'compliance', 'government acceptance', 'advisory'],
};

/**
 * Disclaimer page - States that validation is advisory and not a guarantee.
 *
 * Key messages:
 * - Validation is best-effort guidance only
 * - Official requirements can change
 * - Acceptance is never guaranteed
 * - Users should verify against linked authorities
 */
export default function DisclaimerPage(): React.JSX.Element {
  return (
    <main className="min-h-screen">
      {/* Hero Section with Alert */}
      <div className="w-full py-12 md:py-16 bg-amber-50 dark:bg-amber-950/20 border-b">
        <div className="container px-4 md:px-6 mx-auto max-w-4xl">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-full bg-amber-100 dark:bg-amber-900/50 shrink-0">
              <AlertTriangle className="h-8 w-8 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
                Important Disclaimer
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Hexagen Photo provides <strong>best-effort guidance only</strong>. While we strive
                to maintain accurate and up-to-date specifications from official government sources,
                we cannot guarantee that photos produced using our application will be accepted by
                government authorities.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container px-4 md:px-6 mx-auto max-w-4xl py-12">
        <div className="space-y-8">
          {/* What We Provide */}
          <section>
            <h2 className="text-2xl font-bold mb-4">What We Provide</h2>
            <Card>
              <CardContent className="pt-6">
                <ul className="space-y-4">
                  <ListItem
                    icon={<CheckCircle2 className="h-5 w-5 text-green-600" />}
                    title="Objective Checks"
                    description={[
                      'Dimensions and aspect ratio validation',
                      'File size and format verification',
                      'Pixel resolution requirements',
                      'DPI specifications',
                    ]}
                  />
                  <ListItem
                    icon={<Info className="h-5 w-5 text-blue-600" />}
                    title="Static Specifications"
                    description={[
                      'Official government requirements from linked authorities',
                      'Documented face positioning guidance',
                      'Background color requirements',
                      'Last reviewed dates for transparency',
                    ]}
                  />
                  <ListItem
                    icon={<CheckCircle2 className="h-5 w-5 text-green-600" />}
                    title="Best-Effort Face Detection"
                    description={[
                      'Automated face detection where technically feasible',
                      'Eye height positioning checks',
                      'Chin to top-of-head measurement guidance',
                      'Manual review reminders for subjective criteria',
                    ]}
                  />
                </ul>
              </CardContent>
            </Card>
          </section>

          {/* Limitations */}
          <section>
            <h2 className="text-2xl font-bold mb-4">Limitations & What We Cannot Guarantee</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <LimitationCard
                icon={<XCircle className="h-5 w-5" />}
                title="Changing Requirements"
                description="Government photo requirements can change without notice. Always verify current requirements against the official authority website before submitting."
              />
              <LimitationCard
                icon={<XCircle className="h-5 w-5" />}
                title="Subjective Judgment"
                description="Many requirements involve subjective judgment (facial expression, head covering rules, glasses policies) that cannot be fully automated."
              />
              <LimitationCard
                icon={<XCircle className="h-5 w-5" />}
                title="Print Quality"
                description="We provide digital specifications. Print quality depends on your printer, paper, and settings—we cannot guarantee physical output quality."
              />
              <LimitationCard
                icon={<XCircle className="h-5 w-5" />}
                title="Official Acceptance"
                description="Photo acceptance policies vary by office, officer, and specific circumstances. Compliance with specifications does not guarantee acceptance."
              />
            </div>
          </section>

          {/* Your Responsibility */}
          <section>
            <h2 className="text-2xl font-bold mb-4">Your Responsibility</h2>
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="pt-6">
                <p className="mb-4">
                  Before using any photo for official documents, you should:
                </p>
                <ol className="list-decimal pl-5 space-y-3">
                  <li>
                    <strong>Verify the source:</strong> Click the official authority link provided
                    with each preset to confirm current requirements.
                  </li>
                  <li>
                    <strong>Check the date:</strong> Review the &quot;last reviewed&quot; date on
                    our presets. If it seems outdated, prioritize the official source.
                  </li>
                  <li>
                    <strong>Manual review:</strong> Even when automated checks pass, visually
                    inspect your photo against the official guidelines for subjective criteria.
                  </li>
                  <li>
                    <strong>Professional services:</strong> For critical applications, consider
                    professional passport photo services that can provide acceptance guarantees.
                  </li>
                  <li>
                    <strong>Have backups:</strong> Always keep multiple versions and be prepared
                    to retake photos if they are rejected.
                  </li>
                </ol>
              </CardContent>
            </Card>
          </section>

          {/* Sources */}
          <section>
            <h2 className="text-2xl font-bold mb-4">Our Sources</h2>
            <p className="text-muted-foreground mb-6">
              We reference official government authorities for all preset specifications.
              Each preset includes a link to the original source:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SourceLink
                country="Canada"
                authority="Government of Canada"
                url="https://www.canada.ca/en/immigration-refugees-citizenship/services/canadian-passports/photos.html"
              />
              <SourceLink
                country="United States"
                authority="U.S. Department of State"
                url="https://travel.state.gov/content/travel/en/passports/how-apply/photos.html"
              />
              <SourceLink
                country="India"
                authority="Passport Seva, Government of India"
                url="https://passportindia.gov.in/"
              />
              <SourceLink
                country="All Countries"
                authority="Various Official Sources"
                description="Each preset links to its specific governing authority"
              />
            </div>
          </section>

          {/* Summary */}
          <section className="pt-8 border-t">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">
                By using Hexagen Photo, you acknowledge that:
              </p>
              <div className="inline-flex flex-col items-start text-left bg-muted p-6 rounded-lg">
                <p className="font-medium">
                  Validation results are advisory guidance only.
                </p>
                <p className="font-medium">
                  Government requirements may have changed since our last review.
                </p>
                <p className="font-medium">
                  Acceptance of photos is not guaranteed by any government authority.
                </p>
                <p className="font-medium">
                  You are responsible for verifying requirements against official sources.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

interface ListItemProps {
  icon: React.ReactNode;
  title: string;
  description: string[];
}

function ListItem({ icon, title, description }: ListItemProps): React.JSX.Element {
  return (
    <li className="flex items-start gap-3">
      <div className="shrink-0 mt-0.5">{icon}</div>
      <div>
        <span className="font-semibold">{title}:</span>
        <ul className="mt-1 space-y-1 text-sm text-muted-foreground">
          {description.map((item, index) => (
            <li key={index} className="flex items-center gap-2">
              <span className="text-muted-foreground">•</span>
              {item}
            </li>
          ))}
        </ul>
      </div>
    </li>
  );
}

interface LimitationCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function LimitationCard({ icon, title, description }: LimitationCardProps): React.JSX.Element {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2 text-red-600">
          {icon}
          <CardTitle className="text-base">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

interface SourceLinkProps {
  country: string;
  authority: string;
  url?: string;
  description?: string;
}

function SourceLink({ country, authority, url, description }: SourceLinkProps): React.JSX.Element {
  const content = (
    <div className="flex items-start gap-3 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
      <div className="flex-1">
        <div className="font-semibold">{country}</div>
        <div className="text-sm text-muted-foreground">{authority}</div>
        {description && <div className="text-xs text-muted-foreground mt-1">{description}</div>}
      </div>
      {url && (
        <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
      )}
    </div>
  );

  if (url) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer">
        {content}
      </a>
    );
  }

  return content;
}
