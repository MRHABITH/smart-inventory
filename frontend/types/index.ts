export interface User {
  id: string;
  email: string;
  full_name: string;
  role: "admin" | "warehouse_manager" | "inventory_staff" | "viewer";
  company_id: string;
  company_name: string;
}

export interface AuthState {
  user: User | null;
  access_token: string | null;
  refresh_token: string | null;
  isAuthenticated: boolean;
}

export interface Product {
  id: string;
  company_id: string;
  name: string;
  sku: string;
  category: string | null;
  brand: string | null;
  barcode: string | null;
  price: number;
  cost: number;
  description: string | null;
  short_description: string | null;
  bullet_highlights: string[] | null;
  seo_keywords: string[] | null;
  images: string[] | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  total_stock: number;
}

export interface Warehouse {
  id: string;
  company_id: string;
  name: string;
  location: string | null;
  capacity: number;
  is_active: boolean;
  created_at: string;
  total_items: number;
  total_quantity: number;
  utilization_percent: number;
}

export interface InventoryItem {
  id: string;
  product_id: string;
  warehouse_id: string;
  quantity: number;
  min_stock: number;         // raw DB field
  max_stock: number;         // raw DB field
  min_stock_level: number;   // alias used in API response
  max_stock_level: number;   // alias used in API response
  reorder_point: number;
  updated_at: string;
  product_name: string | null;
  product_sku: string | null;
  warehouse_name: string | null;
  status: "in_stock" | "low_stock" | "out_of_stock" | "overstock" | "normal" | "low";
}

export interface StockMovement {
  id: string;
  product_id: string;
  warehouse_id: string;
  movement_type: "IN" | "OUT" | "TRANSFER" | "RETURN" | "DAMAGED";
  quantity: number;
  reference: string | null;
  notes: string | null;
  created_at: string;
  product_name: string | null;
  warehouse_name: string | null;
}

export interface Alert {
  id: string;
  alert_type: "LOW_STOCK" | "OUT_OF_STOCK" | "OVERSTOCK" | "HIGH_DEMAND" | "SLOW_MOVING" | "REORDER";
  message: string;
  severity: "INFO" | "WARNING" | "CRITICAL";
  is_read: boolean;
  created_at: string;
  product_name: string | null;
  warehouse_name: string | null;
}

export interface DashboardStats {
  total_products: number;
  total_inventory_value: number;
  low_stock_count: number;
  out_of_stock_count: number;
  warehouse_count: number;
  unread_alerts: number;
  total_stock_movements_today: number;
  overstock_count: number;
}

export interface StockTrendPoint {
  date: string;
  stock_in: number;
  stock_out: number;
}

export interface WarehouseUtilization {
  warehouse_name: string;
  total_quantity: number;
  capacity: number;
  utilization_percent: number;
}

export interface TopProduct {
  product_name: string;
  sku: string;
  total_sold: number;
  total_value: number;
}

export interface DashboardData {
  stats: DashboardStats;
  stock_trend: StockTrendPoint[];
  warehouse_utilization: WarehouseUtilization[];
  top_products: TopProduct[];
  recent_alerts: Alert[];
}

export interface AIProductDescription {
  short_description: string;
  detailed_description: string;
  bullet_highlights: string[];
  seo_keywords: string[];
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
