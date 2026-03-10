"use client";
import { motion } from "framer-motion";

export function LoadingSpinner({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizes = { sm: "w-4 h-4", md: "w-8 h-8", lg: "w-12 h-12" };
  return (
    <div className={`₹{sizes[size]} border-2 border-white/10 border-t-violet-500 rounded-full animate-spin`} />
  );
}

export function PageLoader() {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className="w-10 h-10 border-2 border-violet-500/30 border-t-violet-500 rounded-full"
      />
      <p className="text-slate-500 text-sm">Loading...</p>
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="glass-card p-5 space-y-3">
      <div className="skeleton h-4 w-1/3 rounded-lg" />
      <div className="skeleton h-8 w-2/3 rounded-lg" />
      <div className="skeleton h-3 w-1/2 rounded-lg" />
    </div>
  );
}
