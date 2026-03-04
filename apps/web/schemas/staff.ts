import * as z from "zod";

const STAFF_ROLES = ["OWNER", "CASHIER", "MANAGER"] as const;

export const inviteStaffSchema = z.object({
  email: z.email("Please enter a valid email address"),
  role: z.enum(STAFF_ROLES, { error: "Please select a role" }),
});

export type InviteStaffInput = z.infer<typeof inviteStaffSchema>;

export const updateStaffRoleSchema = z.object({
  role: z.enum(STAFF_ROLES, { error: "Please select a role" }),
});

export type UpdateStaffRoleInput = z.infer<typeof updateStaffRoleSchema>;
