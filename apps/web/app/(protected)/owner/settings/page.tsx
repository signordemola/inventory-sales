"use client";

import React from "react";
import { Settings, Building, Cog, Shield } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BusinessProfileForm } from "@/components/settings/business-profile-form";
import { PreferencesForm } from "@/components/settings/preferences-form";

export default function SettingsPage() {
  return (
    <div className="w-full h-full overflow-y-auto bg-slate-50/30 p-6 md:p-10">
      <div className="max-w-5xl mx-auto space-y-10">
        {/* Header Section */}
        <div className="space-y-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-primary/10 rounded-2xl">
              <Settings className="w-6 h-6 text-primary" />
            </div>
            <span className="text-[11px] font-black text-primary uppercase tracking-[0.2em]">
              Administration
            </span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">
            System Settings
          </h1>
          <p className="text-slate-500 font-semibold text-lg max-w-md">
            Configure your business profile, operational preferences, and
            security.
          </p>
        </div>

        {/* Settings Interface */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/50 overflow-hidden">
          <Tabs defaultValue="profile" className="w-full">
            <div className="border-b border-slate-50 bg-slate-50/30 px-8 pt-6">
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
              <TabsContent
                value="profile"
                className="mt-0 focus-visible:ring-0"
              >
                <BusinessProfileForm />
              </TabsContent>
              <TabsContent
                value="preferences"
                className="mt-0 focus-visible:ring-0"
              >
                <PreferencesForm />
              </TabsContent>
              <TabsContent
                value="security"
                className="mt-0 focus-visible:ring-0"
              >
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
    </div>
  );
}
