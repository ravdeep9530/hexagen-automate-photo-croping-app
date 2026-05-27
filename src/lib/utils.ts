type ClassValue =
  | string
  | number
  | false
  | null
  | undefined
  | ClassValue[]
  | { readonly [className: string]: boolean | null | undefined };

/**
 * Small shadcn-style className combiner.
 *
 * The repository intentionally avoids a hard dependency on clsx/tailwind-merge
 * in this lightweight package. This helper covers the same ergonomic API shape
 * used by shadcn components: strings, arrays, and object maps are flattened into
 * a single whitespace-normalized class string while falsy values are ignored.
 */
export function cn(...inputs: readonly ClassValue[]): string {
  const classes: string[] = [];

  for (const input of inputs) {
    collectClasses(input, classes);
  }

  return classes.join(' ').replace(/\s+/g, ' ').trim();
}

function collectClasses(input: ClassValue, classes: string[]): void {
  if (!input) {
    return;
  }

  if (typeof input === 'string' || typeof input === 'number') {
    classes.push(String(input));
    return;
  }

  if (Array.isArray(input)) {
    for (const nested of input) {
      collectClasses(nested, classes);
    }
    return;
  }

  for (const [className, enabled] of Object.entries(input)) {
    if (enabled) {
      classes.push(className);
    }
  }
}
