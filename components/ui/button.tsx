import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "utility";
};

export function Button({ className, variant = "primary", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 whitespace-nowrap transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-50",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-actionFocus",
        variant === "primary" && "rounded-full bg-action px-5 py-2.5 text-[15px] font-normal text-white",
        variant === "secondary" && "rounded-full border border-action px-5 py-2.5 text-[15px] font-normal text-action",
        variant === "utility" && "rounded-lg bg-ink px-4 py-2 text-sm text-white dark:bg-white dark:text-ink",
        className
      )}
      {...props}
    />
  );
}
