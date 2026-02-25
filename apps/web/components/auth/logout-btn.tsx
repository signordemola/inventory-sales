"use client";

import { authClient } from "@/lib/auth-client";
import { Loader2, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

const LogoutButton = () => {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleLogout = () => {
    startTransition(async () => {
      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            router.push("/"); 
          },
        },
      });
    });
  };
  return (
    <button
      onClick={handleLogout}
      className="flex items-center gap-3 w-full pl-1.5 py-3 text-red-600 hover:bg-red-100 hover:text-red-700 rounded-lg cursor-pointer transition-colors duration-500"
    >
      {isPending ? (
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="font-medium">Logging out...</span>
        </div>
      ) : (
        <>
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Log Out</span>
        </>
      )}
    </button>
  );
};

export default LogoutButton;
