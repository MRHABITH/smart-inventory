"use client";
import { motion } from "framer-motion";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  icon: LucideIcon;
  color: "violet" | "emerald" | "amber" | "red" | "blue";
  change?: number;
  changeLabel?: string;
  delay?: number;
}

const colorMap = {
  violet: { bg: "bg-violet-500/10", text: "text-violet-400", border: "border-violet-500/20" },
  emerald: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20" },
  amber: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20" },
  red: { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/20" },
  blue: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20" },
};

export function StatsCard({
  title, value, prefix = "", suffix = "", decimals = 0,
  icon: Icon, color, change, changeLabel, delay = 0,
}: StatsCardProps) {
  const colors = colorMap[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      className="glass-card p-5 relative overflow-hidden group"
    >
      {/* Background glow on hover */}
      <div className={`absolute inset-0 ${colors.bg} opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl`} />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-2.5 rounded-xl ${colors.bg} border ${colors.border}`}>
            <Icon className={`w-5 h-5 ${colors.text}`} />
          </div>
          {change !== undefined && (
            <span className={cn(
              "text-xs font-medium px-2 py-0.5 rounded-full",
              change >= 0 ? "text-emerald-400 bg-emerald-500/10" : "text-red-400 bg-red-500/10"
            )}>
              {change >= 0 ? "+" : ""}{change}%
            </span>
          )}
        </div>

        <div className="mb-1">
          <AnimatedCounter
            value={value}
            prefix={prefix}
            suffix={suffix}
            decimals={decimals}
            className={`text-2xl font-bold text-white`}
            duration={1}
          />
        </div>

        <p className="text-sm text-slate-500 font-medium">{title}</p>

        {changeLabel && (
          <p className="text-xs text-slate-600 mt-1">{changeLabel}</p>
        )}
      </div>
    </motion.div>
  );
}
