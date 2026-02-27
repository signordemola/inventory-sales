"use client";

import { useInviteDetails } from "@/hooks/use-invite";
import Logo from "@/components/logo";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useParams } from "next/navigation";
import { InviteForm } from "@/components/auth/invite-form";
import { Loader2, AlertTriangle } from "lucide-react";

export default function InvitePage() {
  const params = useParams();
  const token = params.token as string;
  const { data: invite, isLoading, isError, error } = useInviteDetails(token);

  return (
    <div className="flex flex-col grow justify-center items-center p-4 sm:p-6 lg:p-8 min-h-screen relative overflow-hidden">
      <div
        className="absolute inset-0 z-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05]"
        style={{
          backgroundImage: "radial-gradient(#008550 0.5px, transparent 0.5px)",
          backgroundSize: "24px 24px",
        }}
      />

      <Card className="w-full max-w-lg mb-12 z-10 shadow-2xl">
        <CardHeader className="flex flex-col items-center">
          <CardTitle className="py-6">
            <Logo />
          </CardTitle>
          <CardDescription className="text-center px-4">
            {isLoading
              ? "Loading your invitation..."
              : isError
                ? "Invalid or Expired Invitation"
                : `You've been invited to join ${invite?.business?.name} as a ${invite?.role}`}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
              <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <p className="text-slate-900 font-bold">
                  This link is invalid or has expired.
                </p>
                <p className="text-slate-500 text-sm max-w-sm">
                  Please ask your manager to generate a new invitation link for
                  you.
                </p>
              </div>
            </div>
          ) : invite ? (
            <InviteForm invite={invite} token={token} />
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
