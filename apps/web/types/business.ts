export interface Business {
  id: string;
  name: string;
  logo: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  currency: string;
  taxRate: number;
  taxIdNumber: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateBusinessPayload {
  name?: string;
  logo?: string;
  address?: string;
  phone?: string;
  email?: string;
  currency?: string;
  taxRate?: number;
  taxIdNumber?: string;
}
