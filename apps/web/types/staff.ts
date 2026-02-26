export type UserRole = "OWNER" | "MANAGER" | "CASHIER";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  businessId: string;
  createdAt: string;
  updatedAt: string;
}
