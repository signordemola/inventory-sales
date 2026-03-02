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
  buyingPrice: number;
  sellingPrice: number;
  isActive: boolean;
  stockLevel: number;
  lowStockThreshold: number;
  businessId: string;
  categoryId?: string;
  supplierId?: string;
  unit?: string;
  category?: Category;
  images?: string[];
  stockRecord?: StockRecord;
  createdAt: string;
  updatedAt: string;
}
