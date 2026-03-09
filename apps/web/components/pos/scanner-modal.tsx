"use client";

import React, { useEffect, useRef, useState } from "react";
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from "html5-qrcode";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
}

export function ScannerModal({ isOpen, onClose, onScan }: ScannerModalProps) {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setIsInitializing(true);
      // Give the dialog time to mount the DOM element before starting the scanner
      const timer = setTimeout(() => {
        if (document.getElementById("reader")) {
          // Initialize scanner
          const config = {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
            formatsToSupport: [
              Html5QrcodeSupportedFormats.EAN_13,
              Html5QrcodeSupportedFormats.EAN_8,
              Html5QrcodeSupportedFormats.CODE_128,
              Html5QrcodeSupportedFormats.CODE_39,
              Html5QrcodeSupportedFormats.UPC_A,
              Html5QrcodeSupportedFormats.UPC_E,
              Html5QrcodeSupportedFormats.QR_CODE,
            ],
            rememberLastUsedCamera: true,
          };

          scannerRef.current = new Html5QrcodeScanner(
            "reader",
            config,
            false, // verbose mode
          );

          scannerRef.current.render(
            (decodedText) => {
              // Successfully decoded
              onScan(decodedText);
              // We don't automatically clear the scanner here because onClose
              // will trigger the cleanup effect below
            },
            (errorMessage) => {
              // Ignored - usually just means no barcode is currently visible
            },
          );
          setIsInitializing(false);
        }
      }, 100);

      return () => {
        clearTimeout(timer);
        if (scannerRef.current) {
          scannerRef.current.clear().catch(console.error);
          scannerRef.current = null;
        }
      };
    }
  }, [isOpen, onScan]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md w-[calc(100%-32px)]">
        <DialogHeader>
          <DialogTitle>Scan Barcode</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center p-4">
          <div
            id="reader"
            className="w-full max-w-sm rounded-xl overflow-hidden shadow-sm"
          ></div>
          {isInitializing && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-slate-950/80">
              <p className="text-sm text-slate-500 font-medium">
                Requesting camera access...
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
