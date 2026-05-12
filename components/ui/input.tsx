import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-full border border-black/10 bg-white px-4 text-[15px] text-ink outline-none transition placeholder:text-black/45 focus:border-action dark:border-white/15 dark:bg-white/10 dark:text-white dark:placeholder:text-white/45",
        className
      )}
      {...props}
    />
  );
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-11 w-full rounded-full border border-black/10 bg-white px-4 text-[15px] text-ink outline-none transition focus:border-action dark:border-white/15 dark:bg-white/10 dark:text-white",
        className
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-24 w-full rounded-[18px] border border-black/10 bg-white px-4 py-3 text-[15px] text-ink outline-none transition placeholder:text-black/45 focus:border-action dark:border-white/15 dark:bg-white/10 dark:text-white dark:placeholder:text-white/45",
        className
      )}
      {...props}
    />
  );
}
