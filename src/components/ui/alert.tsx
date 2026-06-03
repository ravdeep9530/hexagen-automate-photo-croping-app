import type { HTMLAttributes } from "react";

type DivProps = HTMLAttributes<HTMLDivElement>;
type HeadingProps = HTMLAttributes<HTMLHeadingElement>;
type ParagraphProps = HTMLAttributes<HTMLParagraphElement>;

const cx = (...classNames: Array<string | undefined>): string =>
  classNames.filter(Boolean).join(" ");

export const Alert = ({ className, ...props }: DivProps) => (
  <div
    role="alert"
    className={cx(
      "relative w-full rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive",
      className,
    )}
    {...props}
  />
);

export const AlertTitle = ({ className, ...props }: HeadingProps) => (
  <h5 className={cx("mb-1 font-medium leading-none tracking-tight", className)} {...props} />
);

export const AlertDescription = ({ className, ...props }: ParagraphProps) => (
  <div className={cx("text-sm [&_p]:leading-relaxed", className)} {...props} />
);
