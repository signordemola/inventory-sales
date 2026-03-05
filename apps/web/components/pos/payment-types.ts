import { LocalCustomer, PendingPaymentMethod } from "@/lib/db";

export type Step = "method" | "customer" | "confirm";

export type PaymentModalState = {
  selectedMethod: PendingPaymentMethod;
  step: Step;
  selectedCustomer: LocalCustomer | null;
  creditDueDate: string;
  isProcessing: boolean;
  isSuccess: boolean;
  localRef: string | null;
  syncedSaleId: string | null;
  amountTendered: string;
  changeDue: number;
  reference: string;
};
