"use client";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { AlertCircle, RotateCcw } from "lucide-react";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card p-8 max-w-md w-full text-center"
            >
                <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-red-500/20">
                    <AlertCircle className="w-8 h-8 text-red-500" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Something went wrong</h2>
                <p className="text-slate-400 mb-8">
                    The application encountered an unexpected error. We've been notified and are looking into it.
                </p>
                <div className="flex flex-col gap-3">
                    <button
                        onClick={() => reset()}
                        className="btn-primary w-full py-3 rounded-xl flex items-center justify-center gap-2 font-semibold text-white"
                    >
                        <RotateCcw className="w-4 h-4" /> Try again
                    </button>
                    <a
                        href="/"
                        className="px-4 py-3 rounded-xl border border-white/10 text-slate-400 hover:bg-white/5 transition-all text-sm"
                    >
                        Back to Dashboard
                    </a>
                </div>
                {error.digest && (
                    <p className="mt-8 text-[10px] text-slate-600 font-mono">
                        Error ID: {error.digest}
                    </p>
                )}
            </motion.div>
        </div>
    );
}
