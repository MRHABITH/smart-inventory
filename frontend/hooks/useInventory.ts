import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { inventoryAPI } from "@/lib/api";
import toast from "react-hot-toast";

export function useInventory(params?: {
  warehouse_id?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: ["inventory", params],
    queryFn: () => inventoryAPI.list(params).then((r) => r.data),
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000, // real-time polling every 30s
  });
}

export function useStockMovements(params?: {
  product_id?: string;
  warehouse_id?: string;
  movement_type?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: ["movements", params],
    queryFn: () => inventoryAPI.movements(params).then((r) => r.data),
    staleTime: 20 * 1000,
    refetchInterval: 20 * 1000, // real-time polling every 20s
  });
}

export function useStockIn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => inventoryAPI.stockIn(data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventory"] });
      qc.invalidateQueries({ queryKey: ["movements"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["warehouses"] });
      qc.invalidateQueries({ queryKey: ["alerts"] });
      toast.success("Stock added successfully!");
    },
    onError: (err: any) => toast.error(err?.response?.data?.detail || "Stock in failed"),
  });
}

export function useStockOut() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => inventoryAPI.stockOut(data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventory"] });
      qc.invalidateQueries({ queryKey: ["movements"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["warehouses"] });
      qc.invalidateQueries({ queryKey: ["alerts"] });
      toast.success("Stock removed successfully!");
    },
    onError: (err: any) => toast.error(err?.response?.data?.detail || "Stock out failed"),
  });
}

export function useTransfer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => inventoryAPI.transfer(data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventory"] });
      qc.invalidateQueries({ queryKey: ["movements"] });
      qc.invalidateQueries({ queryKey: ["warehouses"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Transfer completed successfully!");
    },
    onError: (err: any) => toast.error(err?.response?.data?.detail || "Transfer failed"),
  });
}

export function useDeleteInventoryItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => inventoryAPI.deleteItem(id).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventory"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["warehouses"] });
      toast.success("Inventory item deleted");
    },
    onError: (err: any) => toast.error(err?.response?.data?.detail || "Delete failed"),
  })
}

export function useDeleteStockMovement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => inventoryAPI.deleteMovement(id).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["movements"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["warehouses"] });
      toast.success("Stock movement deleted");
    },
    onError: (err: any) => toast.error(err?.response?.data?.detail || "Delete failed"),
  })
}
