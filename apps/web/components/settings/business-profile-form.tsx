"use client";

import { useEffect, useState } from "react";
import { useBusiness, useUpdateBusiness } from "@/hooks/use-business";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Building2, Mail, Phone, MapPin, Save, Loader2 } from "lucide-react";

export function BusinessProfileForm() {
  const { data: business, isLoading: isFetching } = useBusiness();
  const updateMutation = useUpdateBusiness();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  useEffect(() => {
    if (business) {
      setName(business.name || "");
      setEmail(business.email || "");
      setPhone(business.phone || "");
      setAddress(business.address || "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [business]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateMutation.mutateAsync({
        name,
        email,
        phone,
        address,
      });
      toast.success("Business profile updated successfully");
    } catch {
      toast.error("Failed to update business profile");
    }
  };

  if (isFetching) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const isSaving = updateMutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-slate-400" />
              Business Name
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Acme Corp"
              className="h-12 rounded-xl bg-slate-50 border-slate-100 focus:bg-white transition-all font-medium"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <Mail className="w-4 h-4 text-slate-400" />
              Business Email
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="contact@business.com"
              className="h-12 rounded-xl bg-slate-50 border-slate-100 focus:bg-white transition-all font-medium"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <Phone className="w-4 h-4 text-slate-400" />
              Phone Number
            </label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+234 ..."
              className="h-12 rounded-xl bg-slate-50 border-slate-100 focus:bg-white transition-all font-medium"
            />
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-slate-400" />
              Business Address
            </label>
            <Textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Full physical address..."
              className="min-h-[148px] rounded-xl bg-slate-50 border-slate-100 focus:bg-white transition-all font-medium resize-none"
            />
          </div>
        </div>
      </div>

      <div className="pt-6 border-t border-slate-100 flex justify-end">
        <Button
          type="submit"
          disabled={isSaving}
          className="h-12 px-8 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold shadow-lg shadow-primary/20 transition-all gap-2"
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Save Changes
        </Button>
      </div>
    </form>
  );
}
