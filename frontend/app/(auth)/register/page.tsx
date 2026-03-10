"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff, Package, CheckCircle, AlertCircle } from "lucide-react";
import { authAPI } from "@/lib/api";
import { useStore } from "@/store/useStore";
import toast from "react-hot-toast";
import Link from "next/link";

export default function RegisterPage() {

  const router = useRouter();
  const { setAuth } = useStore();

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    company_name: "",
    full_name: "",
    email: "",
    password: "",
  });

  const [emailValid, setEmailValid] = useState<boolean | null>(null);

  // password strength checker
  const getPasswordStrength = (password: string) => {
    let score = 0;

    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    return score;
  };

  const passwordStrength = getPasswordStrength(form.password);

  const passwordStrengthText = [
    "Very Weak",
    "Weak",
    "Medium",
    "Strong",
    "Very Strong",
  ];

  const validateEmail = (email: string) => {
    const regex = /\S+@\S+\.\S+/;
    setEmailValid(regex.test(email));
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (loading) return;

    if (passwordStrength < 2) {
      toast.error("Please use a stronger password");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        company_name: form.company_name.trim(),
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        password: form.password.trim(),
      };

      const { data } = await authAPI.register(payload);

      setAuth(data.user, data.access_token, data.refresh_token);

      toast.success("Welcome! Your AI Inventory OS account is ready 🚀");

      router.push("/dashboard");

    } catch (err: any) {

      console.error("Register error:", err);

      let message = "Registration failed. Please try again.";

      if (err?.response?.data) {
        const data = err.response.data;

        if (data.detail) message = data.detail;
        else if (data.message) message = data.message;
        else message = Object.values(data).flat().join(", ");
      }

      toast.error(message);

    } finally {
      setLoading(false);
    }
  }

  const updateField = (key: string, value: string) => {

    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));

    if (key === "email") validateEmail(value);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-900 p-8">

      <div className="absolute inset-0 bg-gradient-radial from-violet-900/10 via-transparent to-transparent" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative w-full max-w-md"
      >

        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">

          <div className="w-10 h-10 rounded-xl bg-gradient-brand flex items-center justify-center">
            <Package className="w-5 h-5 text-white" />
          </div>

          <span className="text-xl font-bold gradient-text">
            AI Inventory OS
          </span>

        </div>

        <h2 className="text-3xl font-bold text-white mb-2">
          Create your account
        </h2>

        <p className="text-slate-400 mb-8">
          Start managing inventory smarter with AI
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Company */}
          <InputField
            label="Company Name"
            placeholder="Acme Store Inc."
            value={form.company_name}
            onChange={(v: string) => updateField("company_name", v)}
          />

          {/* Name */}
          <InputField
            label="Full Name"
            placeholder="John Smith"
            value={form.full_name}
            onChange={(v: string) => updateField("full_name", v)}
          />

          {/* Email */}
          <div>

            <label className="block text-sm text-slate-400 mb-2">
              Work Email
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

          {/* Password */}
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
                placeholder="Create strong password"
                className="input-dark w-full px-4 py-3 pr-12 text-sm"
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>

            </div>

            {/* Password Strength */}
            {form.password && (

              <div className="mt-2 text-xs text-slate-400">

                Strength:{" "}
                <span className="text-violet-400">
                  {passwordStrengthText[passwordStrength]}
                </span>

              </div>

            )}

          </div>

          {/* Button */}
          <motion.button
            disabled={loading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="btn-primary w-full py-3 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >

            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creating Account...
              </>
            ) : (
              "Create Free Account"
            )}

          </motion.button>

        </form>

        {/* Login */}
        <p className="mt-6 text-center text-sm text-slate-500">

          Already have an account?{" "}

          <Link
            href="/login"
            className="text-violet-400 hover:text-violet-300 font-medium"
          >
            Sign in
          </Link>

        </p>

      </motion.div>
    </div>
  );
}


/* Reusable Input */
function InputField({
  label,
  placeholder,
  value,
  onChange,
}: any) {

  return (
    <div>

      <label className="block text-sm text-slate-400 mb-2">
        {label}
      </label>

      <input
        required
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="input-dark w-full px-4 py-3 text-sm"
      />

    </div>
  );
}