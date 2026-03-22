"use client";

import { useEffect } from "react";

export function PrintOnLoad() {
  useEffect(() => {
    const timeout = window.setTimeout(() => {
      window.print();
    }, 280);

    return () => window.clearTimeout(timeout);
  }, []);

  return null;
}
