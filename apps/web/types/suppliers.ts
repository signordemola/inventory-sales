export interface Supplier {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  businessId: string;
  createdAt: string;
  updatedAt: string;
}

export type PurchaseOrderStatus =
  | "PENDING"
  | "PARTIAL"
  | "RECEIVED"
  | "CANCELLED";

export interface PurchaseOrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  received: number;
  cost: string; // Decimal
  createdAt: string;
  product?: {
    id: string;
    name: string;
    sku: string;
    images: string[];
  };
}

export interface PurchaseOrder {
  id: string;
  reference: string;
  supplierId: string;
  status: PurchaseOrderStatus;
  expectedDelivery?: string;
  notes?: string;
  total: string; // Decimal
  createdAt: string;
  updatedAt: string;
  supplier?: Supplier;
  items?: PurchaseOrderItem[];
}

export interface SupplierBalance {
  totalOwed: number;
  totalPaid: number;
  balance: number;
}
