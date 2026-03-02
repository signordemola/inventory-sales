"use client";

import React from "react";
import { ShieldAlert, ArrowLeft, Home } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function UnauthorizedPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden p-8 text-center">
        <div className="mx-auto w-20 h-20 bg-red-50 dark:bg-red-500/10 rounded-full flex items-center justify-center mb-6">
          <ShieldAlert className="w-10 h-10 text-red-500" />
        </div>

        <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">
          Access Denied
        </h1>

        <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed font-medium">
          You don&apos;t have permission to access this area. If you believe
          this is a mistake, please contact your store manager or business owner
          to update your account role.
        </p>

        <div className="space-y-3">
          <Button
            onClick={() => router.back()}
            variant="outline"
            className="w-full h-12 rounded-xl border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>

          <Button
            onClick={() => router.push("/dashboard")}
            className="w-full h-12 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 font-bold shadow-sm"
          >
            <Home className="w-4 h-4 mr-2" />
            Return to Dashboard
          </Button>
        </div>
      </div>

      <p className="text-sm text-slate-400 font-medium mt-8 flex items-center gap-2">
        <ShieldAlert className="w-4 h-4" />
        Role-Based Access Control Error
      </p>
    </div>
  );
}
