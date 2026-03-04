"use client";

import React, { useReducer } from "react";
import { format } from "date-fns";
import { useSuppliers } from "@/hooks/use-suppliers";
import { usePurchaseOrders } from "@/hooks/use-purchase-orders";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  Search,
  Mail,
  Phone,
  ShoppingCart,
  PackagePlus,
  Eye,
  PackageCheck,
} from "lucide-react";
import { Supplier, PurchaseOrder } from "@/types/suppliers";
import dynamic from "next/dynamic";

const AddSupplierModal = dynamic(() =>
  import("@/components/suppliers/add-supplier-modal").then(
    (mod) => mod.AddSupplierModal,
  ),
);
const SupplierDetailsSheet = dynamic(() =>
  import("@/components/suppliers/supplier-details-sheet").then(
    (mod) => mod.SupplierDetailsSheet,
  ),
);
const CreatePOModal = dynamic(() =>
  import("@/components/suppliers/create-po-modal").then(
    (mod) => mod.CreatePOModal,
  ),
);
const ReceivePOModal = dynamic(() =>
  import("@/components/suppliers/receive-po-modal").then(
    (mod) => mod.ReceivePOModal,
  ),
);

// --- State Management ---
type SuppliersPageState = {
  isAddSupplierOpen: boolean;
  selectedSupplierForEdit?: Supplier;
  isDetailsSheetOpen: boolean;
  selectedSupplierId: string | null;
  isCreatePOOpen: boolean;
  isReceivePOOpen: boolean;
  selectedPO: PurchaseOrder | null;
};

type SuppliersPageAction =
  | { type: "OPEN_ADD_SUPPLIER"; payload?: Supplier }
  | { type: "CLOSE_ADD_SUPPLIER" }
  | { type: "OPEN_DETAILS"; payload: string }
  | { type: "CLOSE_DETAILS" }
  | { type: "OPEN_CREATE_PO" }
  | { type: "CLOSE_CREATE_PO" }
  | { type: "OPEN_RECEIVE_PO"; payload: PurchaseOrder }
  | { type: "CLOSE_RECEIVE_PO" };

const initialState: SuppliersPageState = {
  isAddSupplierOpen: false,
  isDetailsSheetOpen: false,
  selectedSupplierId: null,
  isCreatePOOpen: false,
  isReceivePOOpen: false,
  selectedPO: null,
};

function reducer(
  state: SuppliersPageState,
  action: SuppliersPageAction,
): SuppliersPageState {
  switch (action.type) {
    case "OPEN_ADD_SUPPLIER":
      return {
        ...state,
        isAddSupplierOpen: true,
        selectedSupplierForEdit: action.payload,
      };
    case "CLOSE_ADD_SUPPLIER":
      return {
        ...state,
        isAddSupplierOpen: false,
        selectedSupplierForEdit: undefined,
      };
    case "OPEN_DETAILS":
      return {
        ...state,
        isDetailsSheetOpen: true,
        selectedSupplierId: action.payload,
      };
    case "CLOSE_DETAILS":
      return { ...state, isDetailsSheetOpen: false, selectedSupplierId: null };
    case "OPEN_CREATE_PO":
      return { ...state, isCreatePOOpen: true };
    case "CLOSE_CREATE_PO":
      return { ...state, isCreatePOOpen: false };
    case "OPEN_RECEIVE_PO":
      return {
        ...state,
        isReceivePOOpen: true,
        selectedPO: action.payload,
      };
    case "CLOSE_RECEIVE_PO":
      return { ...state, isReceivePOOpen: false, selectedPO: null };
    default:
      return state;
  }
}

// --- Subcomponents ---

function SupplierDirectory({
  suppliers,
  isLoading,
  onAddSupplier,
  onEditSupplier,
  onViewDetails,
}: {
  suppliers?: Supplier[];
  isLoading: boolean;
  onAddSupplier: () => void;
  onEditSupplier: (s: Supplier, e: React.MouseEvent) => void;
  onViewDetails: (id: string, e?: React.MouseEvent) => void;
}) {
  return (
    <Card className="bg-white rounded-xl border shadow-sm overflow-hidden">
      <CardHeader className="border-b bg-gray-50/30 flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search suppliers..."
            className="w-full pl-9 pr-4 h-10 rounded-lg border bg-slate-50 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>
        <button
          onClick={onAddSupplier}
          className="h-10 px-4 rounded-lg font-bold bg-primary hover:bg-primary/90 text-white shadow-sm transition-all text-sm flex items-center justify-center gap-2 w-full sm:w-auto"
        >
          Add Supplier
        </button>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent bg-slate-50/50">
              <TableHead className="font-bold text-slate-900 text-[11px] uppercase tracking-wider">
                Vendor Name
              </TableHead>
              <TableHead className="font-bold text-slate-900 text-[11px] uppercase tracking-wider">
                Contact Info
              </TableHead>
              <TableHead className="font-bold text-slate-900 text-[11px] uppercase tracking-wider">
                Address
              </TableHead>
              <TableHead className="font-bold text-slate-900 text-[11px] uppercase tracking-wider text-right">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array(3)
                .fill(0)
                .map((_, i) => (
                  <TableRow key={`sup-skel-${i}`}>
                    <TableCell>
                      <Skeleton className="h-4 w-40" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-48" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-60" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="h-4 w-20 ml-auto" />
                    </TableCell>
                  </TableRow>
                ))
            ) : suppliers?.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="h-32 text-center text-sm font-bold text-muted-foreground uppercase tracking-widest italic pt-12"
                >
                  No suppliers registered
                </TableCell>
              </TableRow>
            ) : (
              suppliers?.map((supplier) => (
                <TableRow
                  key={supplier.id}
                  className="cursor-pointer hover:bg-slate-50/50 group"
                  onClick={() => onViewDetails(supplier.id)}
                >
                  <TableCell className="font-bold text-slate-900">
                    {supplier.name}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {supplier.email && (
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                          <Mail className="size-3 text-primary/70" />{" "}
                          {supplier.email}
                        </div>
                      )}
                      {supplier.phone && (
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                          <Phone className="size-3 text-primary/70" />{" "}
                          {supplier.phone}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs font-medium text-slate-500 truncate max-w-[200px]">
                    {supplier.address || "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <button
                      onClick={(e) => onEditSupplier(supplier, e)}
                      className="text-[10px] font-black text-slate-400 hover:text-primary mr-4 transition-colors"
                    >
                      EDIT
                    </button>
                    <button className="text-[10px] font-black text-primary hover:underline">
                      DETAILS
                    </button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function PurchaseOrdersTab({
  pos,
  isLoading,
  onCreatePO,
  onReceivePO,
}: {
  pos?: PurchaseOrder[];
  isLoading: boolean;
  onCreatePO: () => void;
  onReceivePO: (po: PurchaseOrder) => void;
}) {
  return (
    <Card className="bg-white rounded-xl border shadow-sm overflow-hidden">
      <CardHeader className="border-b bg-gray-50/30 flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search orders..."
            className="w-full pl-9 pr-4 h-10 rounded-lg border bg-slate-50 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>
        <button
          onClick={onCreatePO}
          className="h-10 px-4 rounded-lg font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-sm transition-all text-sm flex items-center justify-center gap-2 w-full sm:w-auto"
        >
          <PackagePlus className="size-4" /> Create PO
        </button>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent bg-slate-50/50">
              <TableHead className="font-bold text-slate-900 text-[11px] uppercase tracking-wider">
                Ref & Date
              </TableHead>
              <TableHead className="font-bold text-slate-900 text-[11px] uppercase tracking-wider">
                Supplier
              </TableHead>
              <TableHead className="font-bold text-slate-900 text-[11px] uppercase tracking-wider">
                Status
              </TableHead>
              <TableHead className="font-bold text-slate-900 text-[11px] uppercase tracking-wider text-right">
                Total
              </TableHead>
              <TableHead className="font-bold text-slate-900 text-[11px] uppercase tracking-wider text-right">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array(3)
                .fill(0)
                .map((_, i) => (
                  <TableRow key={`po-skel-${i}`}>
                    <TableCell>
                      <Skeleton className="h-4 w-32" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-40" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-20 rounded-full" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="h-4 w-20 ml-auto" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="h-4 w-12 ml-auto" />
                    </TableCell>
                  </TableRow>
                ))
            ) : pos?.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-32 text-center text-sm font-bold text-muted-foreground uppercase tracking-widest italic pt-12"
                >
                  No purchase orders found
                </TableCell>
              </TableRow>
            ) : (
              pos?.map((po) => (
                <TableRow key={po.id} className="hover:bg-slate-50/50">
                  <TableCell>
                    <p className="font-bold text-slate-900">{po.reference}</p>
                    <p className="text-xs font-semibold text-slate-400">
                      {format(new Date(po.createdAt), "MMM d, yyyy")}
                    </p>
                  </TableCell>
                  <TableCell>
                    <p className="font-bold text-slate-700">
                      {po.supplier?.name}
                    </p>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider ${
                        po.status === "RECEIVED"
                          ? "bg-emerald-100 text-emerald-700"
                          : po.status === "PARTIAL"
                            ? "bg-blue-100 text-blue-700"
                            : po.status === "CANCELLED"
                              ? "bg-rose-100 text-rose-700"
                              : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {po.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-black text-slate-900">
                    ₦{parseFloat(po.total).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    {po.status !== "RECEIVED" && po.status !== "CANCELLED" && (
                      <button
                        onClick={() => onReceivePO(po)}
                        className="inline-flex items-center justify-center p-1.5 text-primary hover:bg-primary/10 rounded-md transition-colors"
                        title="Receive Stock"
                      >
                        <PackageCheck className="size-4" />
                      </button>
                    )}
                    <button
                      className="inline-flex items-center justify-center p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                      title="View Order"
                    >
                      <Eye className="size-4" />
                    </button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// --- Main Component ---

export const SuppliersPageView = () => {
  const { data: suppliers, isLoading: isSuppliersLoading } = useSuppliers();
  const { data: pos, isLoading: isPOsLoading } = usePurchaseOrders();
  const [state, dispatch] = useReducer(reducer, initialState);

  const handleEditSupplier = (supplier: Supplier, e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch({ type: "OPEN_ADD_SUPPLIER", payload: supplier });
  };

  const handleViewDetails = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    dispatch({ type: "OPEN_DETAILS", payload: id });
  };

  const handleReceivePO = (po: PurchaseOrder) => {
    dispatch({ type: "OPEN_RECEIVE_PO", payload: po });
  };

  return (
    <div className="flex-1 space-y-8 p-6 md:p-10 h-full overflow-y-auto bg-slate-50/30">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 font-display text-center sm:text-left">
            Suppliers & Procurement
          </h1>
          <p className="text-sm font-semibold text-slate-500 mt-1 text-center sm:text-left">
            Manage vendor relations and purchase history.
          </p>
        </div>
      </div>

      <Tabs defaultValue="directory" className="space-y-6">
        <TabsList className="bg-slate-200/50 p-1 h-12 rounded-xl">
          <TabsTrigger
            value="directory"
            className="rounded-lg font-bold data-[state=active]:bg-white data-[state=active]:text-primary h-full px-6"
          >
            <Users className="size-4 mr-2" /> Vendor Directory
          </TabsTrigger>
          <TabsTrigger
            value="purchase-orders"
            className="rounded-lg font-bold data-[state=active]:bg-white data-[state=active]:text-primary h-full px-6"
          >
            <ShoppingCart className="size-4 mr-2" /> Purchase Orders
          </TabsTrigger>
        </TabsList>

        <TabsContent value="directory" className="space-y-4 outline-none">
          <SupplierDirectory
            suppliers={suppliers}
            isLoading={isSuppliersLoading}
            onAddSupplier={() => dispatch({ type: "OPEN_ADD_SUPPLIER" })}
            onEditSupplier={handleEditSupplier}
            onViewDetails={handleViewDetails}
          />
        </TabsContent>

        <TabsContent value="purchase-orders" className="space-y-4 outline-none">
          <PurchaseOrdersTab
            pos={pos}
            isLoading={isPOsLoading}
            onCreatePO={() => dispatch({ type: "OPEN_CREATE_PO" })}
            onReceivePO={handleReceivePO}
          />
        </TabsContent>
      </Tabs>

      {/* Render Modals */}
      <AddSupplierModal
        isOpen={state.isAddSupplierOpen}
        onClose={() => dispatch({ type: "CLOSE_ADD_SUPPLIER" })}
        supplier={state.selectedSupplierForEdit}
      />
      <SupplierDetailsSheet
        isOpen={state.isDetailsSheetOpen}
        onClose={() => dispatch({ type: "CLOSE_DETAILS" })}
        supplierId={state.selectedSupplierId}
      />
      <CreatePOModal
        isOpen={state.isCreatePOOpen}
        onClose={() => dispatch({ type: "CLOSE_CREATE_PO" })}
      />
      <ReceivePOModal
        isOpen={state.isReceivePOOpen}
        onClose={() => dispatch({ type: "CLOSE_RECEIVE_PO" })}
        purchaseOrder={state.selectedPO}
      />
    </div>
  );
};
