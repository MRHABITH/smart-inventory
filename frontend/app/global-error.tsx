"use client";

import { RotateCcw } from "lucide-react";

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <html>
            <body className="bg-dark-900 text-white min-h-screen flex items-center justify-center p-4">
                <div className="glass-card p-12 max-w-md w-full text-center">
                    <h2 className="text-3xl font-bold mb-4">Critical Error</h2>
                    <p className="text-slate-400 mb-8">
                        A fatal error occurred in the application root.
                    </p>
                    <button
                        onClick={() => reset()}
                        className="btn-primary w-full py-3 rounded-xl flex items-center justify-center gap-2 font-semibold"
                    >
                        <RotateCcw className="w-4 h-4" /> Restart Application
                    </button>
                </div>
            </body>
        </html>
    );
}
