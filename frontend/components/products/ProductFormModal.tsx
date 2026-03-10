"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Save } from "lucide-react";
import { useCreateProduct, useUpdateProduct } from "@/hooks/useProducts";
import { Product } from "@/types";

interface Props { open: boolean; onClose: () => void; product?: Product | null; }

const INITIAL_FORM = {
  name: "", sku: "", category: "", brand: "", barcode: "",
  price: 0, cost: 0, supplier_id: "",
};

export function ProductFormModal({ open, onClose, product }: Props) {
  const create = useCreateProduct();
  const update = useUpdateProduct();
  const [form, setForm] = useState(INITIAL_FORM);

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name, sku: product.sku,
        category: product.category || "", brand: product.brand || "",
        barcode: product.barcode || "", price: product.price,
        cost: product.cost, supplier_id: "",
      });
    } else {
      setForm(INITIAL_FORM);
    }
  }, [product, open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (product) {
      await update.mutateAsync({ id: product.id, data: form });
    } else {
      await create.mutateAsync(form);
    }
    onClose();
  }

  const isLoading = create.isPending || update.isPending;

  const fields = [
    [
      { key: "name", label: "Product Name *", type: "text", placeholder: "e.g. Premium Wireless Headphones", span: 2 },
    ],
    [
      { key: "sku", label: "SKU *", type: "text", placeholder: "e.g. PROD-001" },
      { key: "category", label: "Category", type: "text", placeholder: "e.g. Electronics" },
    ],
    [
      { key: "brand", label: "Brand", type: "text", placeholder: "e.g. Sony" },
      { key: "barcode", label: "Barcode", type: "text", placeholder: "e.g. 123456789012" },
    ],
    [
      { key: "price", label: "Selling Price (₹)", type: "number", placeholder: "0.00" },
      { key: "cost", label: "Cost Price (₹)", type: "number", placeholder: "0.00" },
    ],
  ];

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-lg glass-card p-6 z-10 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white">
                {product ? "Edit Product" : "Add New Product"}
              </h2>
              <button onClick={onClose} className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {fields.map((row, ri) => (
                <div key={ri} className={`grid gap-4 ₹{row.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
                  {row.map(({ key, label, type, placeholder }) => (
                    <div key={key}>
                      <label className="block text-xs font-medium text-slate-400 mb-1.5">{label}</label>
                      <input
                        type={type}
                        step={type === "number" ? "0.01" : undefined}
                        min={type === "number" ? "0" : undefined}
                        value={(form as any)[key]}
                        onChange={(e) => setForm({ ...form, [key]: type === "number" ? parseFloat(e.target.value) || 0 : e.target.value })}
                        placeholder={placeholder}
                        className="input-dark w-full px-3 py-2.5 text-sm"
                        required={key === "name" || key === "sku"}
                      />
                    </div>
                  ))}
                </div>
              ))}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl text-slate-400 border border-white/10 hover:bg-white/5 text-sm font-medium transition-all">
                  Cancel
                </button>
                <motion.button
                  type="submit"
                  disabled={isLoading}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="flex-1 btn-primary py-2.5 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <><Save className="w-4 h-4" />{product ? "Update" : "Create"} Product</>
                  )}
                </motion.button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
