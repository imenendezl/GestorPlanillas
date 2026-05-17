import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const alertVariants = cva("relative w-full rounded-lg border px-4 py-3 text-sm", {
  variants: {
    variant: {
      info: "border-info/25 bg-info/10 text-foreground",
      success: "border-success/25 bg-success/10 text-foreground",
      warning: "border-warning/35 bg-warning/15 text-foreground",
      error: "border-destructive/35 bg-destructive/10 text-foreground"
    }
  },
  defaultVariants: {
    variant: "info"
  }
});

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof alertVariants> {}

export function Alert({ className, variant, ...props }: AlertProps) {
  return (
    <div
      aria-live={variant === "error" ? "assertive" : "polite"}
      className={cn(alertVariants({ variant }), className)}
      role={variant === "error" ? "alert" : "status"}
      {...props}
    />
  );
}

export function AlertTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h5 className={cn("mb-1 font-semibold leading-none tracking-tight", className)} {...props} />;
}

export function AlertDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <div className={cn("text-sm leading-relaxed text-muted-foreground", className)} {...props} />;
}
