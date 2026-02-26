export type SaleStatus = "PAID" | "PENDING" | "CANCELLED" | "REFUNDED";

export interface Sale {
  id: string;
  reference: string;
  total: number;
  discount: number;
  status: SaleStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  businessId: string;
  customerId?: string;
  cashierId: string;
  customer?: {
    id: string;
    name: string;
    phone?: string;
  };
}

export interface SalesResponse {
  items: Sale[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
