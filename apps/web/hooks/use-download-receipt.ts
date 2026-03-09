"use client";

import { useCallback, useState } from "react";
import html2canvas from "html2canvas-pro";
import { jsPDF } from "jspdf";
import { Transaction } from "@/hooks/use-transactions";
import { ReceiptData } from "@/components/pos/payment-types";
import { toast } from "sonner";

export function useDownloadReceipt() {
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePdf = useCallback(
    async (
      transaction: Transaction | ReceiptData,
      action: "download" | "print" = "download",
    ) => {
      const element = document.getElementById(`receipt-${transaction.id}`);

      if (!element) {
        toast.error("Receipt template not found. Please try again.");
        return;
      }

      setIsGenerating(true);
      const toastId = toast.loading(
        action === "print" ? "Preparing print dialog..." : "Generating PDF...",
      );

      try {
        const canvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: "#ffffff",
        });

        const imgData = canvas.toDataURL("image/png");
        const pdfWidth = 80;
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

        const pdf = new jsPDF({
          orientation: "portrait",
          unit: "mm",
          format: [pdfWidth, pdfHeight],
        });

        pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);

        if (action === "print") {
          pdf.autoPrint();
          const docUrl = URL.createObjectURL(pdf.output("blob"));

          // Open PDF blob in a new window which automatically triggers print dialog in modern browsers
          const win = window.open(docUrl, "_blank");
          if (win) {
            win.onload = () => {
              URL.revokeObjectURL(docUrl);
            };
          }
          toast.success("Ready to print!", { id: toastId });
        } else {
          pdf.save(`receipt-${transaction.reference}.pdf`);
          toast.success("Receipt downloaded!", { id: toastId });
        }
      } catch (error: unknown) {
        console.error("PDF Generation Error:", error);
        toast.error("Failed to generate PDF receipt", { id: toastId });
      } finally {
        setIsGenerating(false);
      }
    },
    [],
  );

  const downloadReceipt = useCallback(
    (transaction: Transaction | ReceiptData) =>
      generatePdf(transaction, "download"),
    [generatePdf],
  );

  const printReceipt = useCallback(
    (transaction: Transaction | ReceiptData) =>
      generatePdf(transaction, "print"),
    [generatePdf],
  );

  return { downloadReceipt, printReceipt, isGenerating };
}
