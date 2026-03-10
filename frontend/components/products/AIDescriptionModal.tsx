"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Copy, CheckCircle, Plus, Trash2 } from "lucide-react";
import { aiAPI, productsAPI } from "@/lib/api";
import { Product, AIProductDescription } from "@/types";
import toast from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";

interface Props { open: boolean; onClose: () => void; product?: Product | null; }

export function AIDescriptionModal({ open, onClose, product }: Props) {
  const qc = useQueryClient();
  const [features, setFeatures] = useState<string[]>(["", "", ""]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<AIProductDescription | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  async function handleGenerate() {
    if (!product) return;
    const validFeatures = features.filter(Boolean);
    if (validFeatures.length === 0) {
      toast.error("Add at least one product feature");
      return;
    }
    setLoading(true);
    try {
      const { data } = await aiAPI.generateDescription({
        product_name: product.name,
        category: product.category || "General",
        features: validFeatures,
        brand: product.brand || "",
        price: product.price,
      });
      setResult(data);
      toast.success("AI description generated! ✨");
    } catch {
      toast.error("AI generation failed. Check your API key.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!product || !result) return;
    setSaving(true);
    try {
      await productsAPI.update(product.id, {
        description: result.detailed_description,
        short_description: result.short_description,
        bullet_highlights: result.bullet_highlights,
        seo_keywords: result.seo_keywords,
      });
      qc.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product descriptions saved!");
      onClose();
    } catch {
      toast.error("Failed to save descriptions");
    } finally {
      setSaving(false);
    }
  }

  function handleCopy(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
    toast.success("Copied to clipboard!");
  }

  function addFeature() { setFeatures([...features, ""]); }
  function updateFeature(i: number, val: string) {
    const updated = [...features];
    updated[i] = val;
    setFeatures(updated);
  }
  function removeFeature(i: number) { setFeatures(features.filter((_, idx) => idx !== i)); }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.93, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.93, y: 24 }}
            transition={{ type: "spring", damping: 22, stiffness: 300 }}
            className="relative w-full max-w-2xl glass-card p-6 z-10 max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-violet-500/10 border border-violet-500/20">
                  <Sparkles className="w-5 h-5 text-violet-400" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">AI Description Generator</h2>
                  <p className="text-xs text-slate-500">Powered by Groq · llama-3.3-70b</p>
                </div>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Product Info Banner */}
            {product && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/3 border border-white/5 mb-5">
                <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-violet-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{product.name}</p>
                  <p className="text-xs text-slate-500">{product.category} · {product.sku}</p>
                </div>
              </div>
            )}

            {/* Features Input */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-slate-300">Key Product Features</label>
                <button
                  onClick={addFeature}
                  className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 transition-colors"
                >
                  <Plus className="w-3 h-3" /> Add feature
                </button>
              </div>
              <div className="space-y-2">
                {features.map((f, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      value={f}
                      onChange={(e) => updateFeature(i, e.target.value)}
                      placeholder={`Feature ₹{i + 1} (e.g. 40-hour battery life)`}
                      className="input-dark flex-1 px-3 py-2 text-sm"
                    />
                    {features.length > 1 && (
                      <button
                        onClick={() => removeFeature(i)}
                        className="p-2 rounded-xl text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Generate Button */}
            <motion.button
              onClick={handleGenerate}
              disabled={loading}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="w-full btn-primary py-3 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2 mb-6 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Generating with AI...
                </>
              ) : (
                <><Sparkles className="w-4 h-4" />Generate AI Description</>
              )}
            </motion.button>

            {/* Results */}
            <AnimatePresence>
              {result && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  {/* Short Description */}
                  <ResultSection
                    label="Short Description"
                    content={result.short_description}
                    onCopy={() => handleCopy(result.short_description, "short")}
                    copied={copied === "short"}
                  />

                  {/* Detailed Description */}
                  <ResultSection
                    label="Detailed Description"
                    content={result.detailed_description}
                    onCopy={() => handleCopy(result.detailed_description, "detailed")}
                    copied={copied === "detailed"}
                  />

                  {/* Bullet Highlights */}
                  <div className="p-4 rounded-xl bg-white/3 border border-white/5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Bullet Highlights</span>
                      <button
                        onClick={() => handleCopy(result.bullet_highlights.join("\n"), "bullets")}
                        className="p-1 rounded-lg text-slate-500 hover:text-white transition-colors"
                      >
                        {copied === "bullets" ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                    <ul className="space-y-1.5">
                      {result.bullet_highlights.map((b, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                          <span className="text-violet-400 mt-0.5">•</span>
                          {b}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* SEO Keywords */}
                  <div className="p-4 rounded-xl bg-white/3 border border-white/5">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-3">SEO Keywords</span>
                    <div className="flex flex-wrap gap-2">
                      {result.seo_keywords.map((kw) => (
                        <span key={kw} className="badge-purple">{kw}</span>
                      ))}
                    </div>
                  </div>

                  {/* Save Button */}
                  <motion.button
                    onClick={handleSave}
                    disabled={saving}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
                  >
                    {saving ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>✅ Save to Product</>
                    )}
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function ResultSection({ label, content, onCopy, copied }: {
  label: string; content: string; onCopy: () => void; copied: boolean;
}) {
  return (
    <div className="p-4 rounded-xl bg-white/3 border border-white/5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</span>
        <button onClick={onCopy} className="p-1 rounded-lg text-slate-500 hover:text-white transition-colors">
          {copied ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>
      <p className="text-sm text-slate-300 leading-relaxed">{content}</p>
    </div>
  );
}
