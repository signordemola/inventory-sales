"use client";

import React, { useReducer } from "react";
import { useSuppliers } from "@/hooks/use-suppliers";
import { usePurchaseOrders } from "@/hooks/use-purchase-orders";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, ShoppingCart } from "lucide-react";
import { Supplier, PurchaseOrder } from "@/types/suppliers";
import dynamic from "next/dynamic";
import { SupplierDirectory } from "@/components/suppliers/supplier-directory";
import { PurchaseOrdersTab } from "@/components/suppliers/purchase-orders-tab";

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
