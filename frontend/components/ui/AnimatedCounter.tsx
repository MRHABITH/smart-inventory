"use client";
import { useEffect, useRef } from "react";
import { animate } from "framer-motion";

interface AnimatedCounterProps {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
  duration?: number;
}

export function AnimatedCounter({
  value,
  prefix = "",
  suffix = "",
  decimals = 0,
  className = "",
  duration = 1.2,
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const targetValue = typeof value === "number" ? value : Number(value) || 0;

    const controls = animate(0, targetValue, {
      duration,
      ease: "easeOut",
      onUpdate(latest: any) {
        const val = typeof latest === "number" ? latest : Number(latest) || 0;
        node.textContent = prefix + val.toFixed(decimals) + suffix;
      },
    });

    return () => controls.stop();
  }, [value, prefix, suffix, decimals, duration]);

  return (
    <span ref={ref} className={className}>
      {prefix}0{suffix}
    </span>
  );
}
