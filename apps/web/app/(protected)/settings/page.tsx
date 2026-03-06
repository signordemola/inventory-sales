"use client";

import React from "react";
import { Building, Cog, Shield } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import dynamic from "next/dynamic";

const BusinessProfileForm = dynamic(() =>
  import("@/components/settings/business-profile-form").then(
    (mod) => mod.BusinessProfileForm,
  ),
);
const PreferencesForm = dynamic(() =>
  import("@/components/settings/preferences-form").then(
    (mod) => mod.PreferencesForm,
  ),
);

export default function SettingsPage() {
  return (
    <div className="flex-1 space-y-8 p-6 md:p-10 h-full overflow-y-auto bg-white dark:bg-slate-950">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight font-display">
            System Settings
          </h1>
          <p className="text-sm font-semibold text-slate-500 mt-1">
            Configure your business profile, operational preferences, and
            security.
          </p>
        </div>
      </div>

      {/* Settings Interface */}
      <div className="bg-white rounded-xl border border-slate-200 dark:border-slate-800 shadow-none overflow-hidden">
        <Tabs defaultValue="profile" className="w-full">
          <div className="border-b border-slate-100 dark:border-slate-800/50 bg-white dark:bg-slate-900 px-8 pt-6">
            <TabsList className="bg-transparent p-0 gap-8 h-12">
              <TabsTrigger
                value="profile"
                className="bg-transparent border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none rounded-none px-0 h-full text-sm font-bold text-slate-400 transition-all gap-2"
              >
                <Building className="w-4 h-4" />
                Business Profile
              </TabsTrigger>
              <TabsTrigger
                value="preferences"
                className="bg-transparent border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none rounded-none px-0 h-full text-sm font-bold text-slate-400 transition-all gap-2"
              >
                <Cog className="w-4 h-4" />
                Preferences
              </TabsTrigger>
              <TabsTrigger
                value="security"
                className="bg-transparent border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none rounded-none px-0 h-full text-sm font-bold text-slate-400 transition-all gap-2"
              >
                <Shield className="w-4 h-4" />
                Security
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="p-8 md:p-12">
            <TabsContent value="profile" className="mt-0 focus-visible:ring-0">
              <BusinessProfileForm />
            </TabsContent>
            <TabsContent
              value="preferences"
              className="mt-0 focus-visible:ring-0"
            >
              <PreferencesForm />
            </TabsContent>
            <TabsContent value="security" className="mt-0 focus-visible:ring-0">
              <div className="text-center py-20 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                <Shield className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest italic">
                  Security settings coming soon...
                </p>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
