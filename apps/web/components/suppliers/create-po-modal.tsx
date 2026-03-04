"use client";

import React, { useState } from "react";
import { useForm, UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { poSchema, POFormData } from "@/schemas/suppliers";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreatePurchaseOrder } from "@/hooks/use-purchase-orders";
import { useSuppliers } from "@/hooks/use-suppliers";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Search } from "lucide-react";
import apiClient from "@/lib/axios";
import { Product } from "@/types/products";

interface CreatePOModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Subcomponent: Order Metadata Form (Left Panel)
function OrderDetailsForm({
  form,
  cartTotal,
}: {
  form: UseFormReturn<POFormData>;
  cartTotal: number;
}) {
  const { data: suppliers } = useSuppliers();
  const {
    register,
    setValue,
    formState: { errors },
  } = form;

  return (
    <div className="w-full xl:w-1/3 flex flex-col space-y-4">
      <h3 className="font-bold text-sm tracking-wide text-slate-500 uppercase">
        Order Details
      </h3>

      <div className="space-y-2">
        <Label>Supplier *</Label>
        <Select
          onValueChange={(val: string | null) =>
            setValue("supplierId", val || "")
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select Supplier" />
          </SelectTrigger>
          <SelectContent>
            {suppliers?.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.supplierId && (
          <p className="text-xs text-red-500">{errors.supplierId.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Expected Delivery Date</Label>
        <Input type="date" {...register("expectedDelivery")} />
      </div>

      <div className="space-y-2">
        <Label>Notes / Terms</Label>
        <Textarea
          placeholder="Delivery instructions..."
          className="resize-none"
          {...register("notes")}
        />
      </div>

      <div className="mt-auto pt-6 border-t">
        <div className="flex justify-between items-center">
          <span className="font-bold text-slate-600 uppercase text-sm">
            Estimated Total
          </span>
          <span className="text-2xl font-black text-primary">
            ₦{cartTotal.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}

// Subcomponent: Order Items Builder (Right Panel)
function OrderItemsBuilder({
  cartItems,
  setCartItems,
}: {
  cartItems: { product: Product; quantity: number; cost: number }[];
  setCartItems: React.Dispatch<
    React.SetStateAction<{ product: Product; quantity: number; cost: number }[]>
  >;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.length > 2) {
      setIsSearching(true);
      try {
        const { data } = await apiClient.get<{ data: Product[] }>(
          `/products?search=${query}`,
        );
        setSearchResults(data.data);
      } catch (error) {
        console.error("Search failed", error);
      } finally {
        setIsSearching(false);
      }
    } else {
      setSearchResults([]);
    }
  };

  const addToCart = (product: Product) => {
    const existing = cartItems.find((item) => item.product.id === product.id);
    if (existing) {
      setCartItems((prev) =>
        prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        ),
      );
    } else {
      setCartItems((prev) => [
        ...prev,
        { product, quantity: 1, cost: product.buyingPrice || 0 },
      ]);
    }
    setSearchQuery("");
    setSearchResults([]);
  };

  const updateCartItem = (
    productId: string,
    field: "quantity" | "cost",
    value: number,
  ) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, [field]: value } : item,
      ),
    );
  };

  const removeCartItem = (productId: string) => {
    setCartItems((prev) =>
      prev.filter((item) => item.product.id !== productId),
    );
  };

  return (
    <div className="w-full xl:w-2/3 flex flex-col space-y-4 border-t xl:border-t-0 xl:border-l xl:pl-6 pt-6 xl:pt-0">
      <h3 className="font-bold text-sm tracking-wide text-slate-500 uppercase">
        Order Line Items
      </h3>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
        <Input
          placeholder="Search products to add..."
          className="pl-9 h-11 bg-slate-50"
          value={searchQuery}
          onChange={handleSearch}
        />

        {searchQuery.length > 2 && (
          <div className="absolute top-12 left-0 right-0 bg-white border shadow-xl rounded-xl z-10 overflow-hidden">
            {isSearching ? (
              <div className="p-4 text-center text-sm text-slate-500 flex items-center justify-center gap-2">
                <Loader2 className="size-4 animate-spin" /> Searching...
              </div>
            ) : searchResults.length > 0 ? (
              <ul className="max-h-60 overflow-y-auto">
                {searchResults.map((product) => (
                  <li
                    key={product.id}
                    role="button"
                    tabIndex={0}
                    className="px-4 py-3 border-b hover:bg-slate-50 cursor-pointer flex justify-between items-center"
                    onClick={() => addToCart(product)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        addToCart(product);
                      }
                    }}
                  >
                    <div>
                      <p className="font-bold text-sm">{product.name}</p>
                      <p className="text-xs text-slate-500">{product.sku}</p>
                    </div>
                    <Plus className="size-4 text-primary" />
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-4 text-center text-sm text-slate-500">
                No products found.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Cart Table */}
      <div className="flex-1 bg-white border rounded-xl overflow-hidden mt-2">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left font-bold text-xs uppercase text-slate-500">
                Item
              </th>
              <th className="px-4 py-3 text-left font-bold text-xs uppercase text-slate-500 w-24">
                Qty
              </th>
              <th className="px-4 py-3 text-left font-bold text-xs uppercase text-slate-500 w-32">
                Unit Cost (₦)
              </th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {cartItems.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="p-8 text-center text-slate-400 font-medium italic"
                >
                  Empty Order. Search for products above.
                </td>
              </tr>
            ) : (
              cartItems.map((item) => (
                <tr
                  key={item.product.id}
                  className="border-b last:border-0 hover:bg-slate-50/50"
                >
                  <td className="px-4 py-3">
                    <p className="font-bold text-slate-900">
                      {item.product.name}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <Input
                      type="number"
                      min="1"
                      className="h-8 w-20 px-2"
                      value={item.quantity}
                      onChange={(e) =>
                        updateCartItem(
                          item.product.id,
                          "quantity",
                          parseInt(e.target.value) || 1,
                        )
                      }
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      className="h-8 w-28 px-2"
                      value={item.cost}
                      onChange={(e) =>
                        updateCartItem(
                          item.product.id,
                          "cost",
                          parseFloat(e.target.value) || 0,
                        )
                      }
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      className="text-rose-500 p-1.5 hover:bg-rose-50 rounded-md transition-colors"
                      onClick={() => removeCartItem(item.product.id)}
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function CreatePOModal({ isOpen, onClose }: CreatePOModalProps) {
  const createPO = useCreatePurchaseOrder();

  const [cartItems, setCartItems] = useState<
    { product: Product; quantity: number; cost: number }[]
  >([]);

  const form = useForm<POFormData>({
    resolver: zodResolver(poSchema),
  });

  const cartTotal = cartItems.reduce(
    (sum, item) => sum + item.quantity * item.cost,
    0,
  );

  const handleClose = () => {
    form.reset();
    setCartItems([]);
    onClose();
  };

  const onSubmit = (data: POFormData) => {
    if (cartItems.length === 0) {
      toast.error("Add at least one item to the purchase order");
      return;
    }

    const payload = {
      ...data,
      items: cartItems.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
        cost: item.cost,
      })),
    };

    createPO.mutate(payload, {
      onSuccess: () => {
        toast.success("Purchase Order created successfully");
        handleClose();
      },
      onError: () => toast.error("Failed to create Purchase Order"),
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[800px] h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-6 border-b pb-4 shrink-0">
          <DialogTitle className="text-xl">Create Purchase Order</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col xl:flex-row gap-6">
          <OrderDetailsForm form={form} cartTotal={cartTotal} />
          <OrderItemsBuilder
            cartItems={cartItems}
            setCartItems={setCartItems}
          />
        </div>

        <DialogFooter className="p-4 border-t shrink-0 bg-slate-50/50">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={createPO.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={form.handleSubmit(onSubmit)}
            disabled={createPO.isPending || cartItems.length === 0}
          >
            {createPO.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Submit Purchase Order
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
