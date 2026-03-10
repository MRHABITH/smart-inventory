"use client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Package, IndianRupee, AlertTriangle, XCircle,
  Warehouse, Bell, Activity, TrendingUp,
} from "lucide-react";
import { dashboardAPI } from "@/lib/api";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { StockTrendChart } from "@/components/dashboard/StockTrendChart";
import { WarehouseUtilizationChart } from "@/components/dashboard/WarehouseUtilizationChart";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import { formatCurrency, formatDateRelative, getAlertSeverityColor } from "@/lib/utils";
import { DashboardData } from "@/types";
import { useStore } from "@/store/useStore";
import Link from "next/link";

export default function DashboardPage() {
  const { user } = useStore();
  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ["dashboard"],
    queryFn: () => dashboardAPI.get().then((r) => r.data),
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });

  if (isLoading) return <PageLoader />;
  if (!data) return null;

  const {
    stats = {
      total_products: 0,
      total_inventory_value: 0,
      low_stock_count: 0,
      out_of_stock_count: 0,
      warehouse_count: 0,
      unread_alerts: 0,
      total_stock_movements_today: 0,
      overstock_count: 0
    },
    stock_trend = [],
    warehouse_utilization = [],
    top_products = [],
    recent_alerts = []
  } = data || {};

  const statsCards = [
    { title: "Total Products", value: stats.total_products, icon: Package, color: "violet" as const, delay: 0 },
    { title: "Inventory Value", value: stats.total_inventory_value, prefix: "₹", icon: IndianRupee, color: "emerald" as const, decimals: 0, delay: 0.05 },
    { title: "Low Stock Items", value: stats.low_stock_count, icon: AlertTriangle, color: "amber" as const, delay: 0.1 },
    { title: "Out of Stock", value: stats.out_of_stock_count, icon: XCircle, color: "red" as const, delay: 0.15 },
    { title: "Warehouses", value: stats.warehouse_count, icon: Warehouse, color: "blue" as const, delay: 0.2 },
    { title: "Unread Alerts", value: stats.unread_alerts, icon: Bell, color: "red" as const, delay: 0.25 },
    { title: "Movements Today", value: stats.total_stock_movements_today, icon: Activity, color: "violet" as const, delay: 0.3 },
    { title: "Overstock Items", value: stats.overstock_count, icon: TrendingUp, color: "blue" as const, delay: 0.35 },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-white">
            Good {getGreeting()},{" "}
            <span className="gradient-text">{user?.full_name?.split(" ")[0]}</span> 
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Here's your inventory overview for today
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500">{new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statsCards.map((card) => (
          <StatsCard key={card.title} {...card} />
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <StockTrendChart data={stock_trend} />
        </div>
        <div>
          <WarehouseUtilizationChart data={warehouse_utilization} />
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Products */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Top Selling Products</h3>
          {top_products.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-8">No sales data yet</p>
          ) : (
            <div className="space-y-3">
              {top_products.map((p, i) => (
                <motion.div
                  key={p.sku}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-3"
                >
                  <span className="text-xs font-bold text-slate-600 w-5">#{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium truncate">{p.product_name}</p>
                    <p className="text-xs text-slate-500">{p.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-emerald-400">{p.total_sold} units</p>
                    <p className="text-xs text-slate-500">{formatCurrency(p.total_value)}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Alerts */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">Recent Alerts</h3>
            <Link href="/smart-alerts" className="text-xs text-violet-400 hover:text-violet-300">View all</Link>
          </div>
          {recent_alerts.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-8">No active alerts</p>
          ) : (
            <div className="space-y-2">
              {recent_alerts.map((alert, i) => (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`p-3 rounded-xl border text-xs ₹{getAlertSeverityColor(alert.severity)}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium leading-relaxed flex-1">{alert.message}</p>
                    {!alert.is_read && (
                      <div className="w-2 h-2 rounded-full bg-current opacity-70 shrink-0 mt-0.5" />
                    )}
                  </div>
                  <p className="opacity-50 mt-1">{formatDateRelative(alert.created_at)}</p>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}
