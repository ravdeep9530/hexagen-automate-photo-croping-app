import React from 'react';

import { Card, CardContent } from '@/components/ui/card';

export function PrivacyLocalNotice(): React.JSX.Element {
  return (
    <Card className="border-emerald-200 bg-emerald-50/80 text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-50">
      <CardContent className="p-4">
        <div className="flex gap-3">
          <span aria-hidden="true" className="mt-0.5 text-lg">🔒</span>
          <div>
            <h2 className="text-sm font-semibold">Private by design</h2>
            <p className="mt-1 text-sm leading-6">
              Photos are processed locally in your browser. Your image stays on this device and is not uploaded to Hexagen servers.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
