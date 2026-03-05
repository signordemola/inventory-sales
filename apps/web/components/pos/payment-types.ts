import { LocalCustomer, PendingPaymentMethod } from "@/lib/db";

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
};
