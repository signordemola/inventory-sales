import { defaultCache } from "@serwist/next/worker";
import { Serwist } from "serwist";

// Enables Background Sync — syncs queued sales even when the tab is closed
import { flushSyncQueue } from "@/lib/offline/flushSyncQueue";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const self: any;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [...defaultCache],
  fallbacks: {
    entries: [
      {
        url: "/offline", // Offline fallback page
        matcher({ request }) {
          return request.destination === "document";
        },
      },
    ],
  },
});

// Background Sync — triggered by navigator.serviceWorker.sync.register('sync-pending-sales')
// eslint-disable-next-line @typescript-eslint/no-explicit-any
self.addEventListener("sync", (event: any) => {
  if (event.tag === "sync-pending-sales") {
    console.log("[Serwist] Background sync triggered for pending sales.");
    event.waitUntil(flushSyncQueue());
  }
});

serwist.addEventListeners();
