"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type ModalProps = {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
};

export function Modal({ open, title, children, onClose }: ModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4 backdrop-blur-sm">
      <div className={cn("w-full max-w-lg rounded-apple border border-black/10 bg-white p-6 text-ink dark:border-white/15 dark:bg-[#1f1f21] dark:text-white")}>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-2xl font-semibold tracking-[-0.01em]">{title}</h2>
          <button aria-label="Cerrar" className="rounded-full p-2 transition hover:bg-black/5 active:scale-95 dark:hover:bg-white/10" onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
