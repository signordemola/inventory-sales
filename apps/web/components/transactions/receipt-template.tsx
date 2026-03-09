"use client";

import React from "react";
import { cn, formatCurrency } from "@/lib/utils";
import { Transaction } from "@/hooks/use-transactions";
import { ReceiptData } from "../pos/payment-types";

interface ReceiptTemplateProps {
  transaction: Transaction | ReceiptData;
  businessName?: string;
  businessAddress?: string;
  businessPhone?: string;
  isDownloading?: boolean;
}

export const ReceiptTemplate = React.forwardRef<
  HTMLDivElement,
  ReceiptTemplateProps
>(
  (
    {
      transaction,
      businessName = "NaijaStock POS",
      businessAddress = "Lagos, Nigeria",
      businessPhone = "+234 000 000 0000",
      isDownloading = false,
    },
    ref,
  ) => {
    // 80mm thermal paper is approximately 300px
    return (
      <div
        ref={ref}
        id={`receipt-${transaction.id}`}
        className={cn(
          "w-[300px] text-black bg-white p-4 font-mono text-xs print-receipt-container",
          isDownloading
            ? "block mx-auto"
            : "absolute -left-[9999px] top-0 print:static print:mx-auto",
        )}
        style={{
          margin: 0,
          padding: "16px",
          width: "300px",
        }}
      >
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold mb-1">{businessName}</h1>
          <p className="text-[10px] leading-tight">{businessAddress}</p>
          <p className="text-[10px] leading-tight">{businessPhone}</p>
        </div>

        {/* Meta */}
        <div className="mb-4 border-b border-dashed border-black pb-4 text-[10px]">
          <p>
            <span className="font-semibold">Receipt:</span>{" "}
            {transaction.reference}
          </p>
          <p>
            <span className="font-semibold">Date:</span>{" "}
            {new Date(transaction.createdAt).toLocaleString("en-NG")}
          </p>
          <p>
            <span className="font-semibold">Cashier:</span>{" "}
            {transaction.cashier?.name || "System"}
          </p>
          {transaction.customer && (
            <p>
              <span className="font-semibold">Customer:</span>{" "}
              {transaction.customer.name}
            </p>
          )}
        </div>

        {/* Items Header */}
        <div className="flex justify-between font-bold border-b border-dashed border-black pb-2 mb-2 text-[10px]">
          <span className="w-1/2">Item</span>
          <span className="w-1/4 text-center">Qty</span>
          <span className="w-1/4 text-right">Price</span>
        </div>

        {/* Items List */}
        <div className="space-y-2 mb-4">
          {transaction.items.map((item, idx) => {
            const productName =
              item.productName ||
              ("product" in item ? item.product?.name : undefined) ||
              "Unknown Product";

            const itemId = "id" in item ? item.id : `${item.productId}-${idx}`;

            return (
              <div
                key={itemId}
                className="flex justify-between text-[10px] items-start"
              >
                <span className="w-1/2 pr-2">{productName}</span>
                <span className="w-1/4 text-center">{item.quantity}</span>
                <span className="w-1/4 text-right">
                  {formatCurrency(item.unitPrice * item.quantity)}
                </span>
              </div>
            );
          })}
        </div>

        {/* Totals */}
        <div className="border-t border-dashed border-black pt-2 mb-4 space-y-1 text-[10px]">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>{formatCurrency(transaction.subtotal)}</span>
          </div>

          {transaction.discount > 0 && (
            <div className="flex justify-between">
              <span>Discount:</span>
              <span>-{formatCurrency(transaction.discount)}</span>
            </div>
          )}

          <div className="flex justify-between">
            <span>VAT:</span>
            <span>{formatCurrency(transaction.tax)}</span>
          </div>

          <div className="flex justify-between font-bold text-sm mt-2 border-t border-black pt-2">
            <span>TOTAL:</span>
            <span>{formatCurrency(transaction.total)}</span>
          </div>
        </div>

        {/* Payments */}
        <div className="border-t border-dashed border-black pt-4 mb-6 text-[10px] space-y-1">
          <div className="font-bold mb-1">Payment Method:</div>
          {transaction.payments.map((payment, idx) => (
            <div
              key={"id" in payment ? payment.id : `${payment.method}-${idx}`}
              className="flex justify-between"
            >
              <span>{payment.method}</span>
              <span>{formatCurrency(payment.amount)}</span>
            </div>
          ))}

          {(() => {
            // Dynamically calculate actual money received (excluding credit)
            const actualPaid = transaction.payments
              .filter((p) => p.method !== "CREDIT")
              .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

            const balanceDue = Math.max(0, transaction.total - actualPaid);
            const isCredit = transaction.status === "CREDIT" || balanceDue > 0;

            return (
              <>
                {transaction.status === "COMPLETED" &&
                  (transaction.change || 0) > 0 && (
                    <div className="flex justify-between font-bold mt-1">
                      <span>Change Due:</span>
                      <span>{formatCurrency(transaction.change || 0)}</span>
                    </div>
                  )}
                {isCredit && (
                  <div className="flex justify-between font-bold mt-1 text-red-600">
                    <span className="text-black">Balance Due:</span>
                    <span className="text-black">
                      {formatCurrency(balanceDue)}
                    </span>
                  </div>
                )}
              </>
            );
          })()}
        </div>

        {/* Footer */}
        <div className="text-center text-[10px]">
          <p className="font-bold mb-1">Thank you for your business!</p>
          <p>Please come again.</p>
          <p className="mt-4 text-[8px] italic text-gray-500">
            Powered by NaijaStock
          </p>
        </div>
      </div>
    );
  },
);
ReceiptTemplate.displayName = "ReceiptTemplate";
