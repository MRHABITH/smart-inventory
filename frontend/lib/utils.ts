import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, minimumFractionDigits: 2 }).format(value);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

export function formatDate(date: string): string {
  return format(new Date(date), "MMM d, yyyy");
}

export function formatDateRelative(date: string): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function getStockStatusColor(status: string): string {
  switch (status) {
    case "out_of_stock": return "text-red-400";
    case "low": return "text-amber-400";
    case "overstock": return "text-blue-400";
    default: return "text-emerald-400";
  }
}

export function getStockStatusBadge(status: string): string {
  switch (status) {
    case "out_of_stock": return "badge-danger";
    case "low": return "badge-warning";
    case "overstock": return "badge-info";
    default: return "badge-success";
  }
}

export function getAlertSeverityColor(severity: string): string {
  switch (severity) {
    case "CRITICAL": return "text-red-400 bg-red-500/10 border-red-500/20";
    case "WARNING": return "text-amber-400 bg-amber-500/10 border-amber-500/20";
    default: return "text-blue-400 bg-blue-500/10 border-blue-500/20";
  }
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function getMovementTypeColor(type: string): string {
  switch (type) {
    case "IN": return "text-emerald-400 bg-emerald-500/10";
    case "OUT": return "text-red-400 bg-red-500/10";
    case "TRANSFER": return "text-blue-400 bg-blue-500/10";
    case "RETURN": return "text-violet-400 bg-violet-500/10";
    case "DAMAGED": return "text-orange-400 bg-orange-500/10";
    default: return "text-slate-400 bg-slate-500/10";
  }
}

export function getRoleColor(role: string): string {
  switch (role) {
    case "admin": return "badge-purple";
    case "warehouse_manager": return "badge-info";
    case "inventory_staff": return "badge-success";
    default: return "badge-warning";
  }
}

