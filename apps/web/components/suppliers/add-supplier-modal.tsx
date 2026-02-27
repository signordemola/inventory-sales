"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supplierSchema, SupplierFormData } from "@/schemas/suppliers";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Supplier } from "@/types/suppliers";
import { useCreateSupplier, useUpdateSupplier } from "@/hooks/use-suppliers";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface AddSupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplier?: Supplier | null;
}

export function AddSupplierModal({
  isOpen,
  onClose,
  supplier,
}: AddSupplierModalProps) {
  const isEditing = !!supplier;
  const createSupplier = useCreateSupplier();
  const updateSupplier = useUpdateSupplier();
  const isPending = createSupplier.isPending || updateSupplier.isPending;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SupplierFormData>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      address: "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (supplier) {
        reset({
          name: supplier.name,
          email: supplier.email || "",
          phone: supplier.phone || "",
          address: supplier.address || "",
        });
      } else {
        reset({ name: "", email: "", phone: "", address: "" });
      }
    }
  }, [isOpen, supplier, reset]);

  const onSubmit = (data: SupplierFormData) => {
    if (isEditing && supplier) {
      updateSupplier.mutate(
        { id: supplier.id, payload: data },
        {
          onSuccess: () => {
            toast.success("Supplier updated successfully");
            onClose();
          },
          onError: () => toast.error("Failed to update supplier"),
        },
      );
    } else {
      createSupplier.mutate(data, {
        onSuccess: () => {
          toast.success("Supplier created successfully");
          onClose();
        },
        onError: () => toast.error("Failed to create supplier"),
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Supplier" : "Add New Supplier"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Company Name *</Label>
            <Input
              id="name"
              placeholder="Acme Logistics Ltd"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-xs text-red-500">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="sales@acme.com"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-xs text-red-500">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              placeholder="+234 800 000 0000"
              {...register("phone")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Physical Address</Label>
            <Textarea
              id="address"
              placeholder="Warehouse 4, Trade Fair Complex..."
              className="resize-none"
              {...register("address")}
            />
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Save Changes" : "Create Supplier"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
