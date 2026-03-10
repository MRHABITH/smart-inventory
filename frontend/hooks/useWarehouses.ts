import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { warehousesAPI } from "@/lib/api";
import toast from "react-hot-toast";

export function useWarehouses() {
  return useQuery({
    queryKey: ["warehouses"],
    queryFn: () => warehousesAPI.list().then((r) => {
      const data = r.data;
      return Array.isArray(data) ? data : (data?.data || []);
    }),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateWarehouse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => warehousesAPI.create(data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["warehouses"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Warehouse created!");
    },
    onError: (err: any) => toast.error(err?.response?.data?.detail || "Failed to create warehouse"),
  });
}

export function useUpdateWarehouse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      warehousesAPI.update(id, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["warehouses"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["inventory"] });
      toast.success("Warehouse updated!");
    },
    onError: (err: any) => toast.error(err?.response?.data?.detail || "Failed to update warehouse"),
  });
}

export function useDeleteWarehouse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => warehousesAPI.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["warehouses"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Warehouse removed!");
    },
    onError: (err: any) => toast.error(err?.response?.data?.detail || "Failed to remove warehouse"),
  });
}
