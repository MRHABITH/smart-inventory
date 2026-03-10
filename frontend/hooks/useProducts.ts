import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { productsAPI } from "@/lib/api";
import toast from "react-hot-toast";

export function useProducts(params?: {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
}) {
  return useQuery({
    queryKey: ["products", params],
    queryFn: () => productsAPI.list(params).then((r) => r.data),
    staleTime: 2 * 60 * 1000,
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ["product", id],
    queryFn: () => productsAPI.get(id).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => productsAPI.create(data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Product created successfully!");
    },
    onError: (err: any) => toast.error(err?.response?.data?.detail || "Failed to create product"),
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      productsAPI.update(id, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product updated successfully!");
    },
    onError: (err: any) => toast.error(err?.response?.data?.detail || "Failed to update product"),
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => productsAPI.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Product deleted successfully!");
    },
    onError: (err: any) => toast.error(err?.response?.data?.detail || "Failed to delete product"),
  });
}
