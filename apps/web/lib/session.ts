import { cookies } from "next/headers";
import { cache } from "react";

export const getSession = cache(async () => {
  const cookieStore = await cookies();
  const sessionCookie =
    cookieStore.get("__Secure-inventory_sales_token") ||
    cookieStore.get("inventory_sales_token");

  if (!sessionCookie) {
    return null;
  }

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/auth/get-session`,
      {
        headers: {
          Cookie: cookieStore.toString(),
        },
      },
    );

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("Session fetch failed:", error);
    return null;
  }
});
