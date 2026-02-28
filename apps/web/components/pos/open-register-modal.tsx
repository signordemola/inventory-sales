import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Calculator } from "lucide-react";
import apiClient from "@/lib/axios";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface OpenRegisterModalProps {
  isOpen: boolean;
  onSuccess: () => void;
}

export function OpenRegisterModal({
  isOpen,
  onSuccess,
}: OpenRegisterModalProps) {
  const [startingCash, setStartingCash] = useState<string>("0");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleOpenShift = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(startingCash);

    if (isNaN(amount) || amount < 0) {
      toast.error("Please enter a valid starting cash amount.");
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient.post("/shifts/open", { startingCash: amount });
      toast.success("Register opened successfully!");
      onSuccess();
    } catch (error) {
      console.error(error);
      const axiosError = error as {
        response?: { data?: { message?: string } };
      };
      toast.error(
        axiosError.response?.data?.message || "Failed to open register.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      {/* 
        Prevent closing by clicking outside or pressing escape.
        The shift MUST be opened to use the POS.
      */}
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-4">
            <Calculator className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-center text-xl">
            Open Register
          </DialogTitle>
          <DialogDescription className="text-center">
            You must declare your starting cash float before you can process any
            sales.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleOpenShift} className="space-y-6 mt-4">
          <div className="space-y-2">
            <Label htmlFor="startingCash">Starting Cash Float (₦)</Label>
            <Input
              id="startingCash"
              type="number"
              min="0"
              step="100"
              value={startingCash}
              onChange={(e) => setStartingCash(e.target.value)}
              className="text-lg font-bold"
              required
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              Count the physical cash currently in your drawer.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Button
              type="submit"
              size="lg"
              disabled={isSubmitting}
              className="w-full font-bold text-background"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Opening Register...
                </>
              ) : (
                "Open Register & Start Shift"
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full text-muted-foreground"
              onClick={() => router.push("/dashboard")}
            >
              Cancel & Return to Dashboard
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
