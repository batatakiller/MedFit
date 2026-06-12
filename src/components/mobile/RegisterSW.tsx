"use client";

import { useEffect } from "react";

// Registra o service worker (PWA instalável + estrutura de push).
export function RegisterSW() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* sw é progressivo: falha não afeta o app */
      });
    }
  }, []);
  return null;
}
