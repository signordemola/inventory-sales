"use client";

import React, { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Shield, Smartphone, Monitor, Key, LogOut } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export function SecurityForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [revokeOtherSessions, setRevokeOtherSessions] = useState(false);

  interface SessionItem {
    id: string;
    token: string;
    userAgent?: string | null;
    ipAddress?: string | null;
    createdAt: Date | string;
    [key: string]: unknown;
  }

  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);

  const fetchSessions = async () => {
    setIsLoadingSessions(true);
    try {
      const { data, error } = await authClient.listSessions();
      if (error) {
        console.error("Error fetching sessions:", error);
      }
      if (data) {
        setSessions(data);
      }
    } catch (e) {
      console.error("Failed to fetch sessions", e);
    } finally {
      setIsLoadingSessions(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters long.");
      return;
    }

    setIsChangingPassword(true);
    try {
      const { error } = await authClient.changePassword({
        newPassword,
        currentPassword,
        revokeOtherSessions,
      });

      if (error) {
        toast.error(error.message || "Failed to change password.");
      } else {
        toast.success("Password changed successfully.");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        if (revokeOtherSessions) {
          fetchSessions();
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("An unexpected error occurred.");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleRevokeSession = async (token: string) => {
    try {
      const { error } = await authClient.revokeSession({ token });
      if (error) {
        toast.error("Failed to revoke session.");
      } else {
        toast.success("Session revoked.");
        fetchSessions();
      }
    } catch (err) {
      console.error(err);
      toast.error("An unexpected error occurred.");
    }
  };

  const getDeviceIcon = (userAgent: string) => {
    const ua = userAgent.toLowerCase();
    if (
      ua.includes("mobile") ||
      ua.includes("android") ||
      ua.includes("iphone")
    ) {
      return <Smartphone className="w-5 h-5 text-slate-400" />;
    }
    return <Monitor className="w-5 h-5 text-slate-400" />;
  };

  const parseUserAgent = (userAgent: string) => {
    if (!userAgent) return "Unknown Device";

    let browser = "Unknown Browser";
    let os = "Unknown OS";

    if (userAgent.includes("Chrome")) browser = "Chrome";
    else if (userAgent.includes("Firefox")) browser = "Firefox";
    else if (userAgent.includes("Safari")) browser = "Safari";
    else if (userAgent.includes("Edge")) browser = "Edge";

    if (userAgent.includes("Windows")) os = "Windows";
    else if (userAgent.includes("Mac OS")) os = "macOS";
    else if (userAgent.includes("Linux")) os = "Linux";
    else if (userAgent.includes("Android")) os = "Android";
    else if (userAgent.includes("iPhone") || userAgent.includes("iPad"))
      os = "iOS";

    return `${os} • ${browser}`;
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Change Password Card */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
        <CardHeader className="border-b border-slate-100 dark:border-slate-800/50 pb-6 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-xl">Change Password</CardTitle>
              <CardDescription className="text-slate-500 mt-1">
                Ensure your account is using a long, random password to stay
                secure.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <input
                type="checkbox"
                id="revokeOthers"
                className="rounded border-slate-300 text-primary focus:ring-primary"
                checked={revokeOtherSessions}
                onChange={(e) => setRevokeOtherSessions(e.target.checked)}
              />
              <Label htmlFor="revokeOthers" className="text-sm font-normal">
                Log out of all other devices
              </Label>
            </div>

            <Button
              type="submit"
              disabled={
                isChangingPassword ||
                !currentPassword ||
                !newPassword ||
                !confirmPassword
              }
              className="w-full mt-4"
            >
              {isChangingPassword ? "Saving..." : "Update Password"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Active Sessions Card */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
        <CardHeader className="border-b border-slate-100 dark:border-slate-800/50 pb-6 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-xl">Active Sessions</CardTitle>
              <CardDescription className="text-slate-500 mt-1">
                Manage and revoke your active sessions across other devices.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {isLoadingSessions ? (
            <div className="text-sm text-slate-500 py-4">
              Loading sessions...
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-sm text-slate-500 py-4">
              No active sessions found.
            </div>
          ) : (
            <div className="space-y-4">
              {sessions.map((session) => {
                // Better-auth returns the current session via useSession normally, but listSessions might or might not flag it.
                // We'll just list them all. We don't have a reliable `isCurrent` flag from listSessions alone without `useSession().data.session.id`.
                return (
                  <div
                    key={session.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50"
                  >
                    <div className="flex items-start gap-4">
                      <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shrink-0 shadow-sm border border-slate-100 dark:border-slate-700">
                        {getDeviceIcon(session.userAgent || "")}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-slate-100">
                          {parseUserAgent(session.userAgent || "")}
                        </div>
                        <div className="text-sm text-slate-500 mt-0.5 space-x-2 flex items-center">
                          <span>{session.ipAddress || "Unknown IP"}</span>
                          <span className="text-slate-300 dark:text-slate-600">
                            •
                          </span>
                          <span>
                            Started{" "}
                            {formatDistanceToNow(new Date(session.createdAt), {
                              addSuffix: true,
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 w-full sm:w-auto"
                      onClick={() => handleRevokeSession(session.token)}
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Revoke
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
