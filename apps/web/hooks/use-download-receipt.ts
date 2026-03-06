"use client";

import { useCallback, useState } from "react";
import html2canvas from "html2canvas-pro";
import { jsPDF } from "jspdf";
import { Transaction } from "@/hooks/use-transactions";
import { ReceiptData } from "@/components/pos/payment-types";
import { toast } from "sonner";

export function useDownloadReceipt() {
  const [isGenerating, setIsGenerating] = useState(false);

  const downloadReceipt = useCallback(
    async (transaction: Transaction | ReceiptData) => {
      const element = document.getElementById(`receipt-${transaction.id}`);

      if (!element) {
        toast.error("Receipt template not found. Please try again.");
        return;
      }

      setIsGenerating(true);
      const toastId = toast.loading("Generating PDF...");

      try {
        // Capture the element as a canvas
        const canvas = await html2canvas(element, {
          scale: 2, // Higher scale for better quality
          useCORS: true,
          logging: false,
          backgroundColor: "#ffffff",
        });

        const imgData = canvas.toDataURL("image/png");

        // Receipt dimensions (~80mm width)
        const pdfWidth = 80;
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

        const pdf = new jsPDF({
          orientation: "portrait",
          unit: "mm",
          format: [pdfWidth, pdfHeight],
        });

        pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
        pdf.save(`receipt-${transaction.reference}.pdf`);

        toast.success("Receipt downloaded!", { id: toastId });
      } catch (error: unknown) {
        console.error("PDF Generation Error:", error);
        toast.error("Failed to generate PDF receipt", { id: toastId });
      } finally {
        setIsGenerating(false);
      }
    },
    [],
  );

  return { downloadReceipt, isGenerating };
}
