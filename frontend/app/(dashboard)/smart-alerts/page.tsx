"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Bell, CheckCheck, AlertTriangle, Info } from "lucide-react";
import { useAlerts, useMarkAlertsRead, useMarkAllAlertsRead } from "@/hooks/useAlerts";
import { Alert } from "@/types";
import { formatDateRelative, getAlertSeverityColor } from "@/lib/utils";
import { PageLoader } from "@/components/ui/LoadingSpinner";

const ALERT_ICONS: Record<string, string> = {
  OUT_OF_STOCK: "🔴",
  LOW_STOCK: "⚠️",
  OVERSTOCK: "📦",
  HIGH_DEMAND: "🔥",
  SLOW_MOVING: "🐌",
  REORDER: "🔄",
};

export default function AlertsPage() {
  const [filter, setFilter] = useState<{ unread_only?: boolean; severity?: string }>({});
  const { data, isLoading } = useAlerts({ ...filter, limit: 50 });
  const markRead = useMarkAlertsRead();
  const markAllRead = useMarkAllAlertsRead();

  function handleMarkRead(id: string) { markRead.mutate([id]); }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Smart Alerts</h1>
          <p className="text-slate-500 text-sm mt-1">{data?.total || 0} total alerts</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => markAllRead.mutate()}
          disabled={markAllRead.isPending}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-slate-300 border border-white/10 hover:bg-white/5 transition-all"
        >
          <CheckCheck className="w-4 h-4" /> Mark All Read
        </motion.button>
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap gap-2">
        {[
          { label: "All", key: {} },
          { label: "Unread", key: { unread_only: true } },
          { label: "Critical", key: { severity: "CRITICAL" } },
          { label: "Warning", key: { severity: "WARNING" } },
          { label: "Info", key: { severity: "INFO" } },
        ].map(({ label, key }) => (
          <button
            key={label}
            onClick={() => setFilter(key)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              JSON.stringify(filter) === JSON.stringify(key)
                ? "bg-violet-600 text-white"
                : "text-slate-500 border border-white/10 hover:text-white hover:border-violet-500/30"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <PageLoader />
      ) : (
        <div className="space-y-2">
          {data?.data.map((alert: Alert, i: number) => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className={`glass-card p-4 flex items-start gap-4 transition-all ${
                !alert.is_read ? "border-l-2 " + (
                  alert.severity === "CRITICAL" ? "border-l-red-500" :
                  alert.severity === "WARNING" ? "border-l-amber-500" : "border-l-blue-500"
                ) : "opacity-60"
              }`}
            >
              <span className="text-xl shrink-0 mt-0.5">
                {ALERT_ICONS[alert.alert_type] || "🔔"}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold mb-1 ${getAlertSeverityColor(alert.severity)}`}>
                      {alert.severity === "CRITICAL" ? <AlertTriangle className="w-3 h-3" /> : <Info className="w-3 h-3" />}
                      {alert.severity}
                    </span>
                    <p className="text-sm text-slate-200 leading-relaxed">{alert.message}</p>
                    {alert.product_name && (
                      <p className="text-xs text-slate-500 mt-1">Product: {alert.product_name}</p>
                    )}
                    {alert.warehouse_name && (
                      <p className="text-xs text-slate-500">Warehouse: {alert.warehouse_name}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-slate-600">{formatDateRelative(alert.created_at)}</p>
                    {!alert.is_read && (
                      <button
                        onClick={() => handleMarkRead(alert.id)}
                        className="text-xs text-violet-400 hover:text-violet-300 mt-1 transition-colors"
                      >
                        Mark read
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}

          {(!data?.data || data.data.length === 0) && (
            <div className="glass-card p-12 text-center">
              <Bell className="w-12 h-12 text-slate-700 mx-auto mb-3" />
              <p className="text-slate-400 font-medium">No alerts found</p>
              <p className="text-slate-600 text-sm mt-1">Your inventory is looking healthy!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
