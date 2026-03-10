"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Eye,
  EyeOff,
  Zap,
  Package,
  BarChart3,
  Brain,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { authAPI } from "@/lib/api";
import { useStore } from "@/store/useStore";
import toast from "react-hot-toast";
import Link from "next/link";

export default function LoginPage() {

  const router = useRouter();
  const { setAuth } = useStore();

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    email: "",
    password: "",
    remember: false,
  });

  const [emailValid, setEmailValid] = useState<boolean | null>(null);

  const validateEmail = (email: string) => {
    const regex = /\S+@\S+\.\S+/;
    setEmailValid(regex.test(email));
  };

  const updateField = (key: string, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));

    if (key === "email") validateEmail(value);
  };

  async function handleSubmit(e: React.FormEvent) {

    e.preventDefault();

    if (loading) return;

    if (!emailValid) {
      toast.error("Please enter a valid email address");
      return;
    }

    setLoading(true);

    try {

      const payload = {
        email: form.email.trim(),
        password: form.password.trim(),
      };

      const { data } = await authAPI.login(payload);

      setAuth(data.user, data.access_token, data.refresh_token);

      toast.success(`Welcome back, ${data.user.full_name}!`);

      router.push("/dashboard");

    } catch (err: any) {

      console.error("Login error:", err);

      let message = "Login failed. Please try again.";

      if (err?.response?.data) {
        const data = err.response.data;

        if (data.detail) message = data.detail;
        else if (data.message) message = data.message;
      } else if (err.message === "Network Error") {
        message = "Server unavailable. Please try again later.";
      }

      toast.error(message);

    } finally {
      setLoading(false);
    }
  }

  const features = [
    { icon: Brain, label: "AI-Powered Insights", color: "text-violet-400" },
    { icon: Package, label: "Smart Inventory Tracking", color: "text-blue-400" },
    { icon: BarChart3, label: "Advanced Analytics", color: "text-emerald-400" },
    { icon: Zap, label: "Real-Time Alerts", color: "text-amber-400" },
  ];

  return (
    <div className="min-h-screen flex bg-dark-900">

      {/* LEFT PANEL */}
      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="hidden lg:flex flex-col justify-between w-1/2 p-12 relative overflow-hidden"
      >

        <div className="absolute inset-0 bg-gradient-to-br from-violet-900/40 via-dark-900 to-indigo-900/30" />

        <div className="relative z-10">

          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 rounded-xl bg-gradient-brand flex items-center justify-center">
              <Package className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold gradient-text">
              AI Inventory OS
            </span>
          </div>

          <h1 className="text-4xl font-bold text-white mb-4">
            Smart Inventory
            <br />
            <span className="gradient-text">
              Powered by GoGenix-AI
            </span>
          </h1>

          <p className="text-slate-400 text-lg mb-10">
            Manage warehouses, forecast demand, and automate decisions using AI.
          </p>

          <div className="grid grid-cols-2 gap-4">

            {features.map(({ icon: Icon, label, color }, i) => (

              <motion.div
                key={label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="glass-card p-4 flex items-center gap-3"
              >

                <Icon className={`w-5 h-5 ${color}`} />

                <span className="text-sm text-slate-300 font-medium">
                  {label}
                </span>

              </motion.div>

            ))}

          </div>

        </div>

        <p className="text-slate-170 text-slate-100">
              © 2026 AI Inventory OS
        </p>

      </motion.div>


      {/* RIGHT PANEL */}
      <motion.div
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="flex-1 flex items-center justify-center p-8"
      >

        <div className="w-full max-w-md">

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">
              Welcome back
            </h2>
            <p className="text-slate-400">
              Sign in to your AI inventory dashboard
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* EMAIL */}
            <div>

              <label className="block text-sm text-slate-400 mb-2">
                Email
              </label>

              <div className="relative">

                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  placeholder="you@company.com"
                  className="input-dark w-full px-4 py-3 pr-10 text-sm"
                />

                {emailValid !== null && (

                  <div className="absolute right-3 top-1/2 -translate-y-1/2">

                    {emailValid ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-500" />
                    )}

                  </div>

                )}

              </div>

            </div>


            {/* PASSWORD */}
            <div>

              <label className="block text-sm text-slate-400 mb-2">
                Password
              </label>

              <div className="relative">

                <input
                  required
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) =>
                    updateField("password", e.target.value)
                  }
                  placeholder="••••••••"
                  className="input-dark w-full px-4 py-3 pr-12 text-sm"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(!showPassword)
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500"
                >

                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}

                </button>

              </div>

            </div>


            {/* REMEMBER */}
            <div className="flex items-center justify-between text-sm">

              <label className="flex items-center gap-2 text-slate-400">
                <input
                  type="checkbox"
                  checked={form.remember}
                  onChange={(e) =>
                    updateField("remember", e.target.checked)
                  }
                />
                Remember me
              </label>

            </div>


            {/* LOGIN BUTTON */}
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="btn-primary w-full py-3 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >

              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}

            </motion.button>

          </form>

          <p className="mt-6 text-center text-sm text-slate-500">

            Don't have an account?{" "}

            <Link
              href="/register"
              className="text-violet-400 hover:text-violet-300 font-medium"
            >
              Create one free
            </Link>

          </p>

        </div>

      </motion.div>

    </div>
  );
}