import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  basePath: "/backend/api/auth",
  plugins: [
    inferAdditionalFields({
      user: {
        role: {
          type: "string",
          required: false,
        },
        businessId: {
          type: "string",
          required: false,
        },
        isActive: {
          type: "boolean",
          required: false,
        },
      },
    }),
  ],
});
