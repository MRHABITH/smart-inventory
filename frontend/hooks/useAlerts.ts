import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { alertsAPI } from "@/lib/api";
import toast from "react-hot-toast";

export function useAlerts(params?: {
  unread_only?: boolean;
  severity?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: ["alerts", params],
    queryFn: () => alertsAPI.list(params).then((r) => r.data),
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });
}

export function useMarkAlertsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => alertsAPI.markRead(ids).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["alerts"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useMarkAllAlertsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => alertsAPI.markAllRead().then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["alerts"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("All alerts marked as read");
    },
  });
}
