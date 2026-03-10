"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Warehouse, MapPin, BarChart2, Edit2, Trash2, X } from "lucide-react";
import { useWarehouses, useCreateWarehouse, useUpdateWarehouse, useDeleteWarehouse } from "@/hooks/useWarehouses";
import { Warehouse as WarehouseType } from "@/types";
import { PageLoader } from "@/components/ui/LoadingSpinner";

export default function WarehousePage() {
  const { data: warehouses = [], isLoading } = useWarehouses();
  const create = useCreateWarehouse();
  const update = useUpdateWarehouse();
  const deleteWh = useDeleteWarehouse();

  const [showForm, setShowForm] = useState(false);
  const [editWh, setEditWh] = useState<WarehouseType | null>(null);
  const [form, setForm] = useState({ name: "", location: "", capacity: 10000 });

  function openEdit(wh: WarehouseType) {
    setEditWh(wh);
    setForm({ name: wh.name, location: wh.location || "", capacity: wh.capacity });
    setShowForm(true);
  }

  function closeForm() { setShowForm(false); setEditWh(null); setForm({ name: "", location: "", capacity: 10000 }); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editWh) { await update.mutateAsync({ id: editWh.id, data: form }); }
    else { await create.mutateAsync(form); }
    closeForm();
  }

  const getUtilizationColor = (pct: number) =>
    pct >= 90 ? "from-red-500 to-red-600" :
      pct >= 70 ? "from-amber-500 to-orange-500" :
        "from-violet-500 to-indigo-600";

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Warehouses</h1>
          <p className="text-slate-500 text-sm mt-1">{warehouses?.length || 0} active warehouses</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowForm(true)}
          className="btn-primary flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold"
        >
          <Plus className="w-4 h-4" /> Add Warehouse
        </motion.button>
      </div>

      {/* Warehouse Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence>
          {warehouses?.map((wh: WarehouseType, i: number) => (
            <motion.div
              key={wh.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: i * 0.07 }}
              whileHover={{ y: -4 }}
              className="glass-card p-5 group relative overflow-hidden"
            >
              {/* Gradient bar at top */}
              <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${getUtilizationColor(wh.utilization_percent)}`} />

              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-violet-500/10 border border-violet-500/20">
                    <Warehouse className="w-5 h-5 text-violet-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">{wh.name}</h3>
                    {wh.location && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-500" />
                        <span className="text-xs text-slate-500">{wh.location}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(wh)} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => deleteWh.mutate(wh.id)} className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[
                  { label: "Products", value: wh.total_items || 0 },
                  { label: "Units", value: (wh.total_quantity || 0).toLocaleString() },
                  { label: "Capacity", value: (wh.capacity || 0).toLocaleString() },
                ].map(({ label, value }) => (
                  <div key={label} className="text-center p-2 rounded-xl bg-white/3">
                    <p className="text-base font-bold text-white">{value}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{label}</p>
                  </div>
                ))}
              </div>

              {/* Utilization Bar */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-500">Utilization</span>
                  <span className={`text-xs font-bold ${wh.utilization_percent >= 90 ? "text-red-400" :
                    wh.utilization_percent >= 70 ? "text-amber-400" :
                      "text-emerald-400"
                    }`}>
                    {wh.utilization_percent}%
                  </span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(wh.utilization_percent, 100)}%` }}
                    transition={{ duration: 0.8, ease: "easeOut", delay: i * 0.1 }}
                    className={`h-full rounded-full bg-gradient-to-r ${getUtilizationColor(wh.utilization_percent)}`}
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {warehouses?.length === 0 && (
        <div className="glass-card p-12 text-center">
          <Warehouse className="w-14 h-14 text-slate-700 mx-auto mb-4" />
          <p className="text-slate-400 font-medium">No warehouses yet</p>
          <p className="text-slate-600 text-sm mt-1 mb-4">Create your first warehouse to start tracking stock</p>
          <button onClick={() => setShowForm(true)} className="btn-primary px-6 py-2.5 rounded-xl text-white text-sm font-semibold">
            Add Warehouse
          </button>
        </div>
      )}

      {/* Form Modal */}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={closeForm}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative glass-card p-6 w-full max-w-md z-10"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-white">{editWh ? "Edit Warehouse" : "Add Warehouse"}</h3>
                <button onClick={closeForm} className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                {[
                  { key: "name", label: "Warehouse Name *", type: "text", placeholder: "e.g. East Wing Storage" },
                  { key: "location", label: "Location", type: "text", placeholder: "e.g. New York, NY 10001" },
                ].map(({ key, label, type, placeholder }) => (
                  <div key={key}>
                    <label className="block text-xs text-slate-400 mb-1.5">{label}</label>
                    <input
                      type={type}
                      value={(form as any)[key]}
                      onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                      placeholder={placeholder}
                      required={key === "name"}
                      className="input-dark w-full px-3 py-2.5 text-sm"
                    />
                  </div>
                ))}
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Capacity (units)</label>
                  <input
                    type="number"
                    min="1"
                    value={form.capacity}
                    onChange={(e) => setForm({ ...form, capacity: parseInt(e.target.value) || 10000 })}
                    className="input-dark w-full px-3 py-2.5 text-sm"
                  />
                </div>
                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={closeForm} className="flex-1 py-2.5 rounded-xl text-slate-400 border border-white/10 hover:bg-white/5 text-sm transition-all">Cancel</button>
                  <button type="submit" disabled={create.isPending || update.isPending} className="flex-1 btn-primary py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2">
                    {(create.isPending || update.isPending) ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : (editWh ? "Update" : "Create")}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
