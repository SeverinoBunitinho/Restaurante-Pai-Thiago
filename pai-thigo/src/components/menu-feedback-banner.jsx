"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { cn } from "@/lib/utils";

export function MenuFeedbackBanner({
  notice,
  error,
  durationMs = 3600,
}) {
  const message = String(error || notice || "").trim();
  const isError = Boolean(error);
  const [visible, setVisible] = useState(Boolean(message));
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    setVisible(Boolean(message));
  }, [message]);

  useEffect(() => {
    if (!message) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setVisible(false);

      const params = new URLSearchParams(searchParams?.toString() ?? "");
      params.delete("menuNotice");
      params.delete("menuError");

      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    }, durationMs);

    return () => window.clearTimeout(timeoutId);
  }, [durationMs, message, pathname, router, searchParams]);

  if (!message || !visible) {
    return null;
  }

  return (
    <div
      className={cn(
        "mt-4 rounded-[1.5rem] border px-4 py-3 text-sm leading-6 transition-opacity duration-300",
        isError
          ? "border-[rgba(138,93,59,0.22)] bg-[rgba(138,93,59,0.08)] text-[var(--clay)]"
          : "border-[rgba(95,123,109,0.22)] bg-[rgba(95,123,109,0.08)] text-[var(--forest)]",
      )}
      role="status"
      aria-live="polite"
    >
      {message}
    </div>
  );
}
