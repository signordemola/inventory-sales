"use client";

import { useEffect } from "react";

export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("/sw.js").then(
          (registration) => {
            console.log("[NaijaStock] SW registered:", registration.scope);
          },
          (error) => {
            console.error("[NaijaStock] SW registration failed:", error);
          },
        );
      });
    }
  }, []);

  return null;
}
