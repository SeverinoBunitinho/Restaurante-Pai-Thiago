"use client";

import { LoaderCircle } from "lucide-react";
import { useFormStatus } from "react-dom";

import { cn } from "@/lib/utils";

export function SubmitButton({
  idleLabel = "Confirmar reserva",
  pendingLabel = "Enviando...",
  className,
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={cn("button-primary", className)}
    >
      {pending ? <LoaderCircle size={16} className="animate-spin" /> : null}
      {pending ? pendingLabel : idleLabel}
    </button>
  );
}
