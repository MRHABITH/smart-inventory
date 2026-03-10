"use client";

import { useState, useEffect, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  ArrowLeftRight,
  RefreshCw,
  Trash2,
  Package,
  Warehouse as WarehouseIcon,
  AlertTriangle,
  CheckCircle2,
  X
} from "lucide-react";

import {
  useInventory,
  useStockMovements,
  useStockIn,
  useStockOut,
  useTransfer,
  useDeleteInventoryItem,
  useDeleteStockMovement,
} from "@/hooks/useInventory";

import { useWarehouses } from "@/hooks/useWarehouses";
import { useProducts } from "@/hooks/useProducts";
import { useQueryClient } from "@tanstack/react-query";

import { getStockStatusBadge, formatDate } from "@/lib/utils";
import { PageLoader } from "@/components/ui/LoadingSpinner";

import { useSearchParams } from "next/navigation";
import toast from "react-hot-toast";

type ModalType = "in" | "out" | "transfer" | null;





/* ----------------------------------------------------- */
/* Warehouse Summary Cards */
/* ----------------------------------------------------- */

function WarehouseSummaryCards({ inventory, warehouses }: any) {

  if (!warehouses?.length) return null;

  return (

    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">

      {warehouses.map((wh: any) => {

        const items = inventory.filter((i: any) => i.warehouse_id === wh.id);

        const qty = items.reduce((s: number, i: any) => s + (i.quantity || 0), 0);

        return (

          <motion.div
            key={wh.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-4 border border-white/5 hover:border-violet-500/20 transition"
          >

            <div className="flex items-center gap-2 mb-2">

              <div className="w-7 h-7 rounded-lg bg-violet-500/20 flex items-center justify-center">
                <WarehouseIcon className="w-4 h-4 text-violet-400" />
              </div>

              <span className="text-xs text-white font-semibold truncate">
                {wh.name}
              </span>

            </div>

            <p className="text-2xl font-bold text-white">{qty}</p>

            <p className="text-xs text-slate-500">{items.length} SKUs</p>

          </motion.div>

        );

      })}

    </div>

  );

}





/* ----------------------------------------------------- */
/* Main Inventory Content */
/* ----------------------------------------------------- */

function InventoryContent() {

  const searchParams = useSearchParams();
  const initialSearch = searchParams.get("search") || "";

  const qc = useQueryClient();

  const [tab, setTab] = useState<"inventory" | "movements">("inventory");
  const [modal, setModal] = useState<ModalType>(null);

  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState("");
  const [warehouseFilter, setWarehouseFilter] = useState("");

  const [lastRefreshed, setLastRefreshed] = useState(new Date());



  const { data: inventory, isLoading, isFetching } = useInventory({
    search: searchTerm || undefined,
    status: statusFilter || undefined,
    warehouse_id: warehouseFilter || undefined,
    limit: 200,
  });

  const { data: movements } = useStockMovements({
    search: searchTerm || undefined,
    limit: 100,
  });

  const { data: warehouses } = useWarehouses();
  const { data: products } = useProducts({ limit: 200 });

  const stockIn = useStockIn();
  const stockOut = useStockOut();
  const transfer = useTransfer();

  const deleteItem = useDeleteInventoryItem();
  const deleteMovement = useDeleteStockMovement();



  useEffect(() => {
    if (!isFetching) setLastRefreshed(new Date());
  }, [isFetching]);



  const handleRefresh = () => {

    qc.invalidateQueries({ queryKey: ["inventory"] });
    qc.invalidateQueries({ queryKey: ["movements"] });

    toast.success("Inventory refreshed");

  };



  const statusOptions = [
    { value: "", label: "All Status" },
    { value: "low_stock", label: "Low Stock" },
    { value: "out_of_stock", label: "Out of Stock" },
    { value: "in_stock", label: "In Stock" },
  ];



  return (

    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >

      {/* Header */}

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">

        <div>

          <h1 className="text-2xl font-bold text-white">Inventory</h1>

          <p className="text-sm text-slate-400 mt-1 flex items-center gap-2">

            Track stock across warehouses

            {isFetching && (
              <span className="flex items-center gap-1 text-violet-400 text-xs">
                <RefreshCw className="w-3 h-3 animate-spin" />
                Updating
              </span>
            )}

            {!isFetching && (
              <span className="text-xs text-slate-500">
                Updated {formatDate(lastRefreshed.toISOString())}
              </span>
            )}

          </p>

        </div>



        <div className="flex flex-wrap gap-2">

          <button
            onClick={handleRefresh}
            className="p-2 rounded-lg border border-white/10 text-slate-400 hover:text-white hover:bg-white/5"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={() => setModal("in")}
            className="bg-green-600 hover:bg-green-500 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-2"
          >
            <TrendingUp className="w-4 h-4 " />
            Stock In
          </button>

          <button
            onClick={() => setModal("out")}
            className="bg-red-600 hover:bg-red-500 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-2"
          >
            <TrendingDown className="w-4 h-4" />
            Stock Out
          </button>

          <button
            onClick={() => setModal("transfer")}
            className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-2"
          >
            <ArrowLeftRight className="w-4 h-4" />
            Transfer
          </button>

        </div>

      </div>



      {/* Warehouse Summary */}

      {inventory?.data && warehouses && (
        <WarehouseSummaryCards
          inventory={inventory.data}
          warehouses={Array.isArray(warehouses) ? warehouses : warehouses?.data}
        />
      )}



      {/* Filters */}

      <div className="glass-card p-3 flex flex-wrap gap-3">

        <input
          placeholder="Search product or SKU..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input-dark h-9 px-3 text-sm flex-1 min-w-[220px]"
        />

        {tab === "inventory" && (
          <>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-dark h-9 px-3 text-sm"
            >
              {statusOptions.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>

            <select
              value={warehouseFilter}
              onChange={(e) => setWarehouseFilter(e.target.value)}
              className="input-dark h-9 px-3 text-sm"
            >
              <option value="">All Warehouses</option>

              {(Array.isArray(warehouses)
                ? warehouses
                : warehouses?.data || []
              ).map((w: any) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}

            </select>
          </>
        )}

      </div>



      {/* Table */}

      {isLoading ? (

        <PageLoader />

      ) : (

        <div className="glass-card overflow-hidden">

          <table className="w-full">

            <thead className="bg-white/5">

              <tr className="text-xs text-slate-400 uppercase">

                <th className="px-5 py-3 text-left">Product</th>
                <th className="px-5 py-3 text-left">Warehouse</th>
                <th className="px-5 py-3 text-left">Qty</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-left">Updated</th>
                <th className="px-5 py-3 text-right">Actions</th>

              </tr>

            </thead>

            <tbody>

              <AnimatePresence>

                {inventory?.data?.map((item: any) => (

                  <motion.tr
                    key={item.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-white/[0.04]"
                  >

                    <td className="px-5 py-3 text-white font-medium">
                      {item.product_name}
                    </td>

                    <td className="px-5 py-3 text-slate-400 flex items-center gap-1">
                      <WarehouseIcon className="w-3 h-3" />
                      {item.warehouse_name}
                    </td>

                    <td className="px-5 py-3">

                      <div className="flex items-center gap-2">

                        <span className="font-semibold text-white">
                          {item.quantity}
                        </span>

                        {item.status === "low_stock" && (
                          <AlertTriangle className="w-4 h-4 text-amber-400" />
                        )}

                      </div>

                    </td>

                    <td className="px-5 py-3">
                      <span className={getStockStatusBadge(item.status)}>
                        {item.status}
                      </span>
                    </td>

                    <td className="px-5 py-3 text-xs text-slate-500">
                      {formatDate(item.updated_at)}
                    </td>

                    <td className="px-5 py-3 text-right">

                      <button
                        onClick={() => {
                          if (window.confirm("Delete inventory item?")) {
                            deleteItem.mutate(item.id);
                          }
                        }}
                        className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                    </td>

                  </motion.tr>

                ))}

              </AnimatePresence>

            </tbody>

          </table>



          {!inventory?.data?.length && (

            <div className="py-16 text-center">

              <Package className="w-12 h-12 text-slate-700 mx-auto mb-3" />

              <p className="text-slate-400">No inventory items</p>

            </div>

          )}

        </div>

      )}



      <StockMovementModal
        type={modal}
        onClose={() => setModal(null)}
        products={products?.data || []}
        warehouses={Array.isArray(warehouses) ? warehouses : warehouses?.data || []}
        loading={stockIn.isPending || stockOut.isPending || transfer.isPending}
        onSubmit={async (data: any) => {

          try {

            if (modal === "in") await stockIn.mutateAsync(data);
            if (modal === "out") await stockOut.mutateAsync(data);
            if (modal === "transfer") await transfer.mutateAsync(data);

            setModal(null);

          } catch (err: any) {

            toast.error(err?.response?.data?.detail || "Operation failed");

          }

        }}
      />

    </motion.div>

  );

}





/* ----------------------------------------------------- */
/* Modal */
/* ----------------------------------------------------- */

function StockMovementModal({ type, onClose, products, warehouses, onSubmit, loading }: any) {

  const [form, setForm] = useState<any>({
    product_id: "",
    warehouse_id: "",
    quantity: 1,
  });

  useEffect(() => {

    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handler);

    return () => window.removeEventListener("keydown", handler);

  }, []);



  if (!type) return null;

  return (

    <div className="fixed inset-0 z-50 flex items-center justify-center">

      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      <div className="relative bg-[#0f0f12] border border-white/10 rounded-2xl p-6 w-full max-w-md">

        <div className="flex justify-between items-center mb-4">

          <h3 className="text-lg font-semibold text-white">
            Stock Movement
          </h3>

          <button onClick={onClose}>
            <X className="w-4 h-4 text-slate-400" />
          </button>

        </div>



        <div className="space-y-3">

          <select
            className="input-dark w-full"
            onChange={(e) => setForm({ ...form, product_id: e.target.value })}
          >

            <option value="">Select Product</option>

            {products.map((p: any) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}

          </select>



          <select
            className="input-dark w-full"
            onChange={(e) => setForm({ ...form, warehouse_id: e.target.value })}
          >

            <option value="">Select Warehouse</option>

            {warehouses.map((w: any) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}

          </select>



          <input
            type="number"
            min="1"
            value={form.quantity}
            onChange={(e) =>
              setForm({ ...form, quantity: Number(e.target.value) })
            }
            className="input-dark w-full"
          />

        </div>



        <button
          disabled={loading}
          onClick={() => onSubmit(form)}
          className="btn-primary w-full mt-5 flex items-center justify-center gap-2"
        >

          {loading ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              Confirm
            </>
          )}

        </button>

      </div>

    </div>

  );

}





/* ----------------------------------------------------- */
/* Page Export */
/* ----------------------------------------------------- */

export default function InventoryPage() {

  return (
    <Suspense fallback={<PageLoader />}>
      <InventoryContent />
    </Suspense>
  );

}