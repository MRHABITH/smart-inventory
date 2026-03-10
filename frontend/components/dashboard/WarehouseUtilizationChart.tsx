"use client";
import {
  RadialBarChart, RadialBar, ResponsiveContainer,
  Cell, PieChart, Pie, Tooltip,
} from "recharts";
import { WarehouseUtilization } from "@/types";

const COLORS = ["#7c3aed", "#4f46e5", "#06b6d4", "#10b981", "#f59e0b"];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload?.length) {
    const d = payload[0].payload;
    return (
      <div className="glass-card p-3 border border-white/10">
        <p className="text-xs font-semibold text-white mb-1">{d.warehouse_name}</p>
        <p className="text-xs text-slate-400">
          {d.total_quantity.toLocaleString()} / {d.capacity.toLocaleString()} units
        </p>
        <p className="text-xs text-violet-400 font-medium">{d.utilization_percent}% utilized</p>
      </div>
    );
  }
  return null;
};

export function WarehouseUtilizationChart({ data }: { data: WarehouseUtilization[] }) {
  const chartData = data.map((d) => ({
    ...d,
    value: d.utilization_percent,
  }));

  return (
    <div className="glass-card p-5">
      <div className="flex items-start justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold text-white">Warehouse Utilization</h3>
          <p className="text-xs text-slate-500 mt-0.5">Capacity usage per warehouse</p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={85}
            paddingAngle={3}
            dataKey="value"
          >
            {chartData.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} opacity={0.85} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      <div className="space-y-2 mt-3">
        {data.map((wh, i) => (
          <div key={wh.warehouse_name} className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
            <span className="text-xs text-slate-400 flex-1 truncate">{wh.warehouse_name}</span>
            <div className="flex-1 bg-white/5 rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${Math.min(wh.utilization_percent, 100)}%`,
                  background: COLORS[i % COLORS.length],
                }}
              />
            </div>
            <span className="text-xs text-slate-300 font-medium w-12 text-right">
              {wh.utilization_percent}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
