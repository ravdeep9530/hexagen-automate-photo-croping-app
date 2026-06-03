import * as React from "react";

function cn(...classes: Array<string | undefined>): string {
  return classes.filter((value) => value !== undefined && value.length > 0).join(" ");
}

export const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "relative w-full rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-950",
      "[&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-red-600",
      "[&>svg~*]:pl-7",
      className,
    )}
    {...props}
  />
));

Alert.displayName = "Alert";

export const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-medium leading-none tracking-tight", className)}
    {...props}
  />
));

AlertTitle.displayName = "AlertTitle";

export const AlertDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm leading-relaxed [&_p]:leading-relaxed", className)}
    {...props}
  />
));

AlertDescription.displayName = "AlertDescription";
