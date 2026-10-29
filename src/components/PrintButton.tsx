"use client";

import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="print:hidden flex items-center gap-2 px-4 py-2 bg-surface-muted hover:bg-neutral-800 border border-surface-border rounded-lg text-xs font-medium text-white transition-colors"
    >
      <Printer className="w-3.5 h-3.5" /> Drukuj / Zapisz PDF
    </button>
  );
}
