export interface Category {
  id: string;
  name: string;
  description?: string;
}

export interface StockRecord {
  quantity: number;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  sku: string;
  barcode?: string;
  costPrice: number;
  salePrice: number;
  stockEnabled: boolean;
  stockLevel: number;
  lowStockThreshold: number;
  businessId: string;
  categoryId?: string;
  supplierId?: string;
  category?: Category;
  images?: string[];
  stockRecord?: StockRecord;
  createdAt: string;
  updatedAt: string;
}
