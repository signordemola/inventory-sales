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

export interface StaffInvite {
  id: string;
  email: string;
  role: UserRole;
  token: string;
  status: "PENDING" | "ACCEPTED" | "REVOKED";
  expiresAt: string;
  createdAt: string;
}
