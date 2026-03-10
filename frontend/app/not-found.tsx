import Link from "next/link";
import { FileQuestion } from "lucide-react";

export default function NotFound() {
    return (
        <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4 text-center">
            <div className="glass-card p-12 max-w-md w-full">
                <div className="w-16 h-16 bg-violet-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-violet-500/20">
                    <FileQuestion className="w-8 h-8 text-violet-400" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">404</h2>
                <p className="text-lg font-medium text-slate-300 mb-2">Page Not Found</p>
                <p className="text-slate-500 mb-8 text-sm">
                    Sorry, we couldn't find the page you're looking for. It might have been moved or doesn't exist.
                </p>
                <Link
                    href="/"
                    className="btn-primary block w-full py-3 rounded-xl font-semibold text-white transition-all"
                >
                    Return Home
                </Link>
            </div>
        </div>
    );
}
