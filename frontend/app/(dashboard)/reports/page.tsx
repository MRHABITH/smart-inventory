"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  Download,
  BarChart3,
  Package,
  Warehouse,
  Loader2,
  X,
} from "lucide-react";

import { reportsAPI } from "@/lib/api";
import { downloadBlob } from "@/lib/utils";
import toast from "react-hot-toast";

type ReportType = "inventory-valuation" | "stock-movement" | "warehouse-stock";

export default function ReportsPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [preview, setPreview] = useState<any>(null);
  const [activeReport, setActiveReport] = useState<ReportType | null>(null);

  /* ---------------- REPORT PREVIEW ---------------- */

  async function loadReport(type: ReportType) {
    const key = `${type}-preview`;
    setLoading(key);

    try {
      let data;

      if (type === "inventory-valuation") {
        const res = await reportsAPI.inventoryValuation("json");
        data = res.data;
      }

      if (type === "stock-movement") {
        const res = await reportsAPI.stockMovement(30, "json");
        data = res.data;
      }

      if (type === "warehouse-stock") {
        const res = await reportsAPI.warehouseStock();
        data = res.data;
      }

      setPreview(data);
      setActiveReport(type);
    } catch (err: any) {
      console.error(err);

      const message =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        "Unable to load report preview";

      toast.error(message);
    } finally {
      setLoading(null);
    }
  }

  /* ---------------- DOWNLOAD ---------------- */

  async function handleDownload(type: ReportType, format: "csv" | "excel") {
    const key = `${type}-${format}`;
    setLoading(key);

    try {
      let res: any;

      if (type === "inventory-valuation") {
        res = await reportsAPI.inventoryValuation(format);
      } else if (type === "stock-movement") {
        res = await reportsAPI.stockMovement(30, format);
      } else {
        toast.error("Download not supported for this report type");
        return;
      }

      const ext = format === "excel" ? "xlsx" : "csv";

      downloadBlob(res.data, `${type}.${ext}`);

      toast.success(`${format.toUpperCase()} downloaded`);
    } catch (err) {
      toast.error("Download failed");
    } finally {
      setLoading(null);
    }
  }

  /* ---------------- REPORT CARDS ---------------- */

  const reports = [
    {
      type: "inventory-valuation" as ReportType,
      icon: Package,
      title: "Inventory Valuation",
      description: "Total inventory cost & retail value across warehouses",
      color: "violet",
    },
    {
      type: "stock-movement" as ReportType,
      icon: BarChart3,
      title: "Stock Movement",
      description: "Track all stock inflow, outflow and transfers",
      color: "emerald",
    },
    {
      type: "warehouse-stock" as ReportType,
      icon: Warehouse,
      title: "Warehouse Stock",
      description: "Detailed warehouse stock breakdown",
      color: "blue",
    },
  ];

  return (
    <div className="space-y-6">

      {/* HEADER */}

      <div>
        <h1 className="text-2xl font-bold text-white">Reports & Analytics</h1>
        <p className="text-slate-400 text-sm">
          Generate intelligent inventory insights and export reports
        </p>
      </div>

      {/* REPORT CARDS */}

      <div className="grid md:grid-cols-3 gap-5">

        {reports.map(({ type, icon: Icon, title, description, color }, i) => (
          <motion.div
            key={type}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition"
          >
            <div
              className={`p-3 rounded-xl w-fit mb-4 bg-${color}-500/10 border border-${color}-500/20`}
            >
              <Icon className={`w-5 h-5 text-${color}-400`} />
            </div>

            <h3 className="text-white font-semibold mb-1">{title}</h3>

            <p className="text-xs text-slate-500 mb-4">{description}</p>

            <div className="space-y-2">

              {/* PREVIEW */}

              <button
                onClick={() => toast("this feature comming soon", { icon: "ℹ️" })}
                disabled={loading === `${type}-preview`}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-slate-700 text-sm text-white hover:bg-slate-800 transition"
              >
                {loading === `${type}-preview` ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <FileText className="w-4 h-4" />
                )}

                Preview
              </button>

              {/* DOWNLOAD */}

              {type !== "warehouse-stock" && (
                <div className="grid grid-cols-2 gap-2">
                  {(["csv", "excel"] as const).map((fmt) => (
                    <button
                      key={fmt}
                      onClick={() => toast("this feature comming soon", { icon: "ℹ️" })}
                      disabled={!!loading}
                      className="flex items-center justify-center gap-2 py-2 rounded-lg text-xs border border-slate-700 hover:bg-slate-800 text-slate-300 transition"
                    >
                      {loading === `${type}-${fmt}` ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Download className="w-3 h-3" />
                      )}

                      {fmt.toUpperCase()}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* PREVIEW PANEL */}

      {preview && activeReport && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900 border border-slate-800 rounded-2xl p-6"
        >
          <div className="flex justify-between items-center mb-5">
            <h3 className="text-white font-semibold">Report Preview</h3>

            <button
              onClick={() => setPreview(null)}
              className="text-slate-500 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>

          {/* INVENTORY VALUATION */}

          {activeReport === "inventory-valuation" && preview.items && (
            <div>

              <div className="grid grid-cols-2 gap-5 mb-6">

                <div className="bg-slate-800 rounded-xl p-4">
                  <p className="text-xs text-slate-400 mb-1">Total Cost</p>
                  <p className="text-xl font-bold text-white">
                    ₹{preview.total_cost_value?.toLocaleString()}
                  </p>
                </div>

                <div className="bg-slate-800 rounded-xl p-4">
                  <p className="text-xs text-slate-400 mb-1">Retail Value</p>
                  <p className="text-xl font-bold text-emerald-400">
                    ₹{preview.total_retail_value?.toLocaleString()}
                  </p>
                </div>

              </div>

              <div className="overflow-x-auto">

                <table className="w-full text-sm">

                  <thead className="border-b border-slate-800 text-slate-400 text-xs uppercase">
                    <tr>
                      <th className="py-2 text-left">Product</th>
                      <th>SKU</th>
                      <th>Warehouse</th>
                      <th>Qty</th>
                      <th>Cost</th>
                      <th>Price</th>
                      <th>Cost Value</th>
                      <th>Retail Value</th>
                    </tr>
                  </thead>

                  <tbody>

                    {preview.items.slice(0, 20).map((item: any, i: number) => (
                      <tr
                        key={i}
                        className="border-b border-slate-800 hover:bg-slate-800"
                      >
                        <td className="py-2 text-slate-200">
                          {item.product_name}
                        </td>

                        <td className="text-slate-400">{item.sku}</td>

                        <td className="text-slate-400">{item.warehouse}</td>

                        <td className="text-white font-medium">
                          {item.quantity}
                        </td>

                        <td className="text-slate-400">₹{item.cost}</td>

                        <td className="text-slate-300">₹{item.price}</td>

                        <td className="text-amber-400">
                          ₹{item.cost_value}
                        </td>

                        <td className="text-emerald-400">
                          ₹{item.retail_value}
                        </td>
                      </tr>
                    ))}

                  </tbody>

                </table>

              </div>
            </div>
          )}

          {/* WAREHOUSE STOCK */}

          {activeReport === "warehouse-stock" && Array.isArray(preview) && (
            <div className="space-y-4">

              {preview.map((wh: any, i: number) => (
                <div
                  key={i}
                  className="bg-slate-800 rounded-xl p-4"
                >
                  <div className="flex justify-between mb-3">

                    <div>
                      <h4 className="text-white font-semibold text-sm">
                        {wh.warehouse}
                      </h4>

                      <p className="text-xs text-slate-500">
                        {wh.location || "—"}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-xs text-slate-400">
                        Utilization
                      </p>

                      <p
                        className={`font-bold ${wh.utilization >= 80
                          ? "text-red-400"
                          : "text-emerald-400"
                          }`}
                      >
                        {wh.utilization}%
                      </p>
                    </div>

                  </div>

                  <div className="space-y-1">

                    {wh.products.slice(0, 5).map((p: any, j: number) => (
                      <div
                        key={j}
                        className="flex justify-between text-xs"
                      >
                        <span className="text-slate-400">
                          {p.name} ({p.sku})
                        </span>

                        <span
                          className={
                            p.status === "low"
                              ? "text-amber-400"
                              : "text-white"
                          }
                        >
                          {p.quantity} units
                        </span>
                      </div>
                    ))}

                  </div>

                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}