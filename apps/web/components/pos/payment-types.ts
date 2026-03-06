import { LocalCustomer, PendingPaymentMethod } from "@/lib/db";

export interface ReceiptData {
  id: string;
  reference: string;
  createdAt: string;
  cashier: { name: string };
  customer?: { name: string };
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  amountPaid: number;
  change: number;
  status:
    | "COMPLETED"
    | "VOID"
    | "RETURNED"
    | "PARTIALLY_RETURNED"
    | "PENDING"
    | "CREDIT";
  payments: Array<{
    method: "CASH" | "CARD" | "TRANSFER" | "PAYSTACK" | "CREDIT";
    amount: number;
  }>;
}

export type Step = "payment" | "customer" | "confirm";

/** A single row in a split-payment breakdown */
export interface SplitPaymentRow {
  id: string;
  method: PendingPaymentMethod;
  amount: string; // string so empty input works naturally
  reference: string;
}

export type PaymentModalState = {
  payments: SplitPaymentRow[];
  step: Step;
  selectedCustomer: LocalCustomer | null;
  creditDueDate: string;
  isProcessing: boolean;
  isSuccess: boolean;
  localRef: string | null;
  syncedSaleId: string | null;
  changeDue: number;
  receiptData?: ReceiptData;
};
