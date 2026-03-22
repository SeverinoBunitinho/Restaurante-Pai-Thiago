"use client";

import { Printer } from "lucide-react";

export function PrintTriggerButton({ className = "button-primary" }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className={className}
    >
      <Printer size={16} />
      Imprimir
    </button>
  );
}
