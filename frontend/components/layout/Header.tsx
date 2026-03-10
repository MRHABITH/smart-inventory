"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Search, RefreshCw, Menu } from "lucide-react";
import { useStore } from "@/store/useStore";
import { useAlerts } from "@/hooks/useAlerts";
import { formatDateRelative, getAlertSeverityColor } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function Header() {
  const { user, toggleSidebar } = useStore();
  const qc = useQueryClient();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const [notifOpen, setNotifOpen] = useState(false);
  const { data: alertsData } = useAlerts({ unread_only: true, limit: 8 });
  const unreadCount = alertsData?.total || 0;

  function handleRefresh() {
    qc.invalidateQueries();
  }

  const initials = user?.full_name
    ? user.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "AI";

  return (
    <header className="h-16 flex items-center justify-between px-6 border-b border-white/5 bg-dark-800/80 backdrop-blur-sm shrink-0 z-40">
      {/* Search */}
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <button
          onClick={toggleSidebar}
          className="md:hidden p-2 rounded-xl text-slate-500 hover:text-white hover:bg-white/5 transition-all"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="relative flex-1 hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && searchQuery.trim()) {
                router.push(`/products?search=₹{encodeURIComponent(searchQuery.trim())}`);
              }
            }}
            placeholder="Search products, SKUs, warehouses..."
            className="input-dark w-full pl-10 pr-4 py-2 text-sm"
          />
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleRefresh}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-200 hover:bg-white/5 transition-all"
          title="Refresh data"
        >
          <RefreshCw className="w-4 h-4" />
        </motion.button>

        {/* Notifications */}
        <div className="relative">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative p-2 rounded-xl text-slate-500 hover:text-slate-200 hover:bg-white/5 transition-all"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold"
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </motion.span>
            )}
          </motion.button>

          <AnimatePresence>
            {notifOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setNotifOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-12 w-96 bg-[#080812] border border-white/10 p-1 z-40 shadow-2xl rounded-2xl"
                >
                  <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                    <span className="text-sm font-semibold text-white">Notifications</span>
                    {unreadCount > 0 && (
                      <span className="badge-danger">{unreadCount} unread</span>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto">
                    {alertsData?.data && alertsData.data.length > 0 ? (
                      alertsData.data.map((alert: any) => (
                        <div
                          key={alert.id}
                          className={`px-4 py-3 border-b border-white/5 last:border-0 ${getAlertSeverityColor(alert.severity)} rounded-lg m-1`}
                        >
                          <p className="text-xs font-medium mb-1">{alert.alert_type?.replace("_", " ")}</p>
                          <p className="text-xs opacity-80 leading-relaxed">{alert.message}</p>
                          <p className="text-xs opacity-50 mt-1">{formatDateRelative(alert.created_at)}</p>
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-8 text-center text-slate-500 text-sm">
                        No unread alerts
                      </div>
                    )}
                  </div>

                  <div className="px-4 py-2 border-t border-white/5">
                    <Link href="/smart-alerts" onClick={() => setNotifOpen(false)} className="text-xs text-violet-400 hover:text-violet-300">
                      View all alerts
                    </Link>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* User Avatar */}
        <div className="flex items-center gap-3 pl-2 border-l border-white/5">
          <div className="w-8 h-8 rounded-xl bg-gradient-brand flex items-center justify-center text-white text-xs font-bold">
            {initials}
          </div>
          <div className="hidden sm:block">
            <p className="text-xs font-semibold text-white leading-tight">{user?.full_name}</p>
            <p className="text-xs text-slate-500 capitalize">{user?.role?.replace("_", " ")}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
