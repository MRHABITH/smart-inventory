"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, Filter, Package, Edit2, Trash2, Sparkles } from "lucide-react";
import { useProducts, useDeleteProduct } from "@/hooks/useProducts";
import { ProductFormModal } from "@/components/products/ProductFormModal";
import { AIDescriptionModal } from "@/components/products/AIDescriptionModal";
import { Product } from "@/types";
import { useSearchParams } from "next/navigation";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PageLoader } from "@/components/ui/LoadingSpinner";

import { Suspense } from "react";

function ProductsContent() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get("search") || "";

  const [search, setSearch] = useState(initialSearch);
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [aiProduct, setAiProduct] = useState<Product | null>(null);

  const { data, isLoading } = useProducts({ page, limit: 20, search: search || undefined });
  const deleteProduct = useDeleteProduct();

  function handleEdit(p: Product) { setEditProduct(p); setShowForm(true); }
  function handleAI(p: Product) { setAiProduct(p); setShowAI(true); }
  function handleDelete(id: string) {
    if (confirm("Delete this product? This action cannot be undone.")) {
      deleteProduct.mutate(id);
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Products</h1>
          <p className="text-slate-500 text-sm mt-1">
            {data?.total || 0} products in your catalog
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => { setEditProduct(null); setShowForm(true); }}
          className="btn-primary flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold"
        >
          <Plus className="w-4 h-4" />
          Add Product
        </motion.button>
      </div>

      {/* Filters */}
      <div className="glass-card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by name or SKU..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="input-dark w-full pl-10 pr-4 py-2.5 text-sm"
          />
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <PageLoader />
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full data-table">
              <thead>
                <tr>
                  {["Product", "SKU", "Category", "Price", "Cost", "Stock", "Created", "Actions"].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {data?.data.map((product: Product, i: number) => (
                    <motion.tr
                      key={product.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: i * 0.02 }}
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
                            <Package className="w-4 h-4 text-violet-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">{product.name}</p>
                            {product.brand && <p className="text-xs text-slate-500">{product.brand}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="badge-purple">{product.sku}</span>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-slate-400">{product.category || "—"}</td>
                      <td className="px-5 py-3.5 text-sm font-semibold text-white">{formatCurrency(product.price)}</td>
                      <td className="px-5 py-3.5 text-sm text-slate-400">{formatCurrency(product.cost)}</td>
                      <td className="px-5 py-3.5">
                        <span className={product.total_stock === 0 ? "badge-danger" : product.total_stock < 20 ? "badge-warning" : "badge-success"}>
                          {product.total_stock} units
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-500">{formatDate(product.created_at)}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1">
                          <button
                            title="Generate AI Description"
                            onClick={() => handleAI(product)}
                            className="p-1.5 rounded-lg text-violet-400 hover:text-violet-300 hover:bg-violet-500/10 transition-all"
                          >
                            <Sparkles className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEdit(product)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>

            {data?.data.length === 0 && (
              <div className="text-center py-16">
                <Package className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                <p className="text-slate-500">No products found.</p>
                <p className="text-slate-600 text-sm">Add your first product to get started.</p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {data && data.total > 20 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-white/5">
              <p className="text-xs text-slate-500">
                Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, data.total)} of {data.total}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 text-xs rounded-lg bg-white/5 text-slate-300 disabled:opacity-40 hover:bg-white/10 transition-all"
                >
                  Previous
                </button>
                <span className="text-xs text-slate-500">Page {page}</span>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page * 20 >= data.total}
                  className="px-3 py-1.5 text-xs rounded-lg bg-white/5 text-slate-300 disabled:opacity-40 hover:bg-white/10 transition-all"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <ProductFormModal
        open={showForm}
        onClose={() => { setShowForm(false); setEditProduct(null); }}
        product={editProduct}
      />
      <AIDescriptionModal
        open={showAI}
        onClose={() => { setShowAI(false); setAiProduct(null); }}
        product={aiProduct}
      />
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <ProductsContent />
    </Suspense>
  );
}
