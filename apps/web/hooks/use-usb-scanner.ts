import { useEffect } from "react";

/**
 * Hook to detect and capture input from physical USB barcode scanners.
 *
 * USB scanners act as fast keyboards. They rapidly fire 'keydown' events
 * and end with an 'Enter' key. This hook listens globally, buffers rapid
 * alphanumeric input, and triggers the callback when a scan completes.
 */
export function useUsbScanner(
  onScan: (barcode: string) => void,
  options: {
    enabled?: boolean;
    // Time threshold in ms between keystrokes to be considered a scanner
    timeThreshold?: number;
  } = {},
) {
  const { enabled = true, timeThreshold = 50 } = options;

  useEffect(() => {
    if (!enabled) return;

    let buffer = "";
    let lastKeyTime = Date.now();

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore input if we are currently typing in an input/textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      const currentTime = Date.now();
      const timeDiff = currentTime - lastKeyTime;
      lastKeyTime = currentTime;

      // If too much time has passed since the last key, it's normal typing, reset buffer
      if (timeDiff > timeThreshold) {
        buffer = "";
      }

      // If 'Enter', evaluate if we have a scanned barcode
      if (e.key === "Enter") {
        if (buffer.length > 3) {
          // Prevent default to stop any form submissions if focused
          e.preventDefault();
          onScan(buffer);
        }
        buffer = "";
        return;
      }

      // Add alphanumeric characters to the buffer
      if (e.key.length === 1 && /^[a-zA-Z0-9_-]+$/.test(e.key)) {
        buffer += e.key;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onScan, enabled, timeThreshold]);
}
