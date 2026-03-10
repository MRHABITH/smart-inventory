"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/store/useStore";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Package, Warehouse, ClipboardList,
  Bell, BarChart3, Bot, ChevronLeft, ChevronRight,
  LogOut, Settings, Package2,
} from "lucide-react";
import { useAlerts } from "@/hooks/useAlerts";

const NAV_ITEMS = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/products", icon: Package, label: "Products" },
  { href: "/warehouse", icon: Warehouse, label: "Warehouses" },
  { href: "/inventory", icon: ClipboardList, label: "Inventory" },
  { href: "/smart-alerts", icon: Bell, label: "Smart Alerts", badge: true },
  { href: "/reports", icon: BarChart3, label: "Reports" },
  { href: "/ai-assistant", icon: Bot, label: "AI Assistant", highlight: true },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar, user, clearAuth } = useStore();
  const { data: alertsData } = useAlerts({ unread_only: true });
  const unreadCount = alertsData?.total || 0;

  function handleLogout() {
    clearAuth();
    window.location.href = "/login";
  }

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleSidebar}
            className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 260 : 72 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className={cn(
          "fixed left-0 top-0 h-full z-50 flex flex-col bg-dark-800 border-r border-white/5 overflow-hidden",
          "transition-transform duration-300 md:translate-x-0 shadow-2xl md:shadow-none",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="flex items-center h-16 px-4 border-b border-white/5 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-brand flex items-center justify-center shrink-0">
            <Package2 className="w-5 h-5 text-white" />
          </div>
          <AnimatePresence>
            {sidebarOpen && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="ml-3 text-base font-bold gradient-text whitespace-nowrap"
              >
                GoGenix-AI Inventory
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto overflow-x-hidden">
          {NAV_ITEMS.map(({ href, icon: Icon, label, badge, highlight }) => {
            const isActive = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link key={href} href={href}>
                <motion.div
                  whileHover={{ x: 2 }}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 relative group",
                    isActive
                      ? "sidebar-item-active text-white"
                      : "text-slate-500 hover:text-slate-200 hover:bg-white/5",
                    highlight && !isActive && "text-violet-400 hover:text-violet-300"
                  )}
                >
                  <div className="relative shrink-0">
                    <Icon className="w-5 h-5" />
                    {badge && unreadCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </div>
                  <AnimatePresence>
                    {sidebarOpen && (
                      <motion.span
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -8 }}
                        transition={{ duration: 0.15 }}
                        className="text-sm font-medium whitespace-nowrap"
                      >
                        {label}
                      </motion.span>
                    )}
                  </AnimatePresence>

                  {/* Tooltip for collapsed state */}
                  {!sidebarOpen && (
                    <div className="absolute left-full ml-3 px-2 py-1 bg-dark-600 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity z-50">
                      {label}
                    </div>
                  )}
                </motion.div>
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="p-2 border-t border-white/5 space-y-1 shrink-0">
          {sidebarOpen && user && (
            <div className="px-3 py-2 mb-1">
              <p className="text-xs font-semibold text-white truncate">{user.full_name}</p>
              <p className="text-xs text-slate-500 truncate">{user.email}</p>
            </div>
          )}

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-500/5 transition-all"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {sidebarOpen && <span className="text-sm font-medium">Sign Out</span>}
          </button>

          {/* Collapse Toggle */}
          <button
            onClick={toggleSidebar}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 hover:text-slate-300 hover:bg-white/5 transition-all"
          >
            {sidebarOpen ? (
              <ChevronLeft className="w-5 h-5 shrink-0" />
            ) : (
              <ChevronRight className="w-5 h-5 shrink-0" />
            )}
            {sidebarOpen && <span className="text-xs text-slate-600">Collapse</span>}
          </button>
        </div>
      </motion.aside>
    </>
  );
}
