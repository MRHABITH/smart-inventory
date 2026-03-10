"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User, Sparkles, RefreshCw } from "lucide-react";
import { aiAPI } from "@/lib/api";
import { ChatMessage } from "@/types";
import ReactMarkdown from "react-markdown";
import toast from "react-hot-toast";

const STARTER_PROMPTS = [
  "Which products will run out of stock soon?",
  "Show me slow-moving inventory items",
  "Which items should I reorder this week?",
  "What's my overall inventory health?",
  "Give me demand forecast insights",
  "How can I optimize my warehouse space?",
];

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>(STARTER_PROMPTS.slice(0, 3));
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage(text?: string) {
    const msgText = text || input.trim();
    if (!msgText || loading) return;

    const userMsg: ChatMessage = { role: "user", content: msgText, timestamp: new Date().toISOString() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const { data } = await aiAPI.chat({
        message: msgText,
        history: messages.slice(-6).map(({ role, content }) => ({ role, content })),
      });

      const aiMsg: ChatMessage = {
        role: "assistant",
        content: data.response,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiMsg]);
      if (data.suggestions?.length > 0) setSuggestions(data.suggestions);
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || "AI assistant unavailable. Check your Groq API key.";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleClear() {
    setMessages([]);
    setSuggestions(STARTER_PROMPTS.slice(0, 3));
  }

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)]">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-4 shrink-0"
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-violet-500/10 border border-violet-500/20">
            <Bot className="w-6 h-6 text-violet-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">GoGenix-AI Inventory Assistant</h1>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <p className="text-xs text-slate-500">Powered by GoGenix-AI</p>
            </div>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={handleClear}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-slate-500 hover:text-white hover:bg-white/5 text-xs transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" /> New Chat
          </button>
        )}
      </motion.div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto glass-card p-4 mb-4 space-y-4">
        {/* Welcome State */}
        {messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center h-full text-center py-10"
          >
            <div className="relative mb-6">
              <div className="w-20 h-20 rounded-3xl bg-gradient-brand flex items-center justify-center shadow-2xl">
                <Bot className="w-10 h-10 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-400 rounded-full flex items-center justify-center">
                <Sparkles className="w-3 h-3 text-dark-900" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Hello, I'm GoGenix-AI</h2>
            <p className="text-slate-400 text-sm max-w-md leading-relaxed mb-8">
              Your intelligent inventory assistant. I can analyze your stock levels, predict demand,
              identify slow-moving products, and give you actionable insights.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
              {STARTER_PROMPTS.map((prompt) => (
                <motion.button
                  key={prompt}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => sendMessage(prompt)}
                  className="glass-card-hover px-4 py-3 rounded-xl text-left text-sm text-slate-300 hover:text-white border border-white/5 hover:border-violet-500/30 transition-all"
                >
                  {prompt}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Messages */}
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <div className="w-8 h-8 rounded-xl bg-gradient-brand flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              )}
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${msg.role === "user"
                    ? "bg-violet-600/80 text-white rounded-br-md"
                    : "glass-card text-slate-200 rounded-bl-md"
                  }`}
              >
                {msg.role === "assistant" ? (
                  <div className="prose prose-invert prose-sm max-w-none">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p>{msg.content}</p>
                )}
              </div>
              {msg.role === "user" && (
                <div className="w-8 h-8 rounded-xl bg-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-4 h-4 text-slate-300" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing Indicator */}
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-3"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-brand flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="glass-card px-4 py-3 rounded-2xl rounded-bl-md">
              <div className="flex gap-1.5 items-center h-5">
                {[0, 0.15, 0.3].map((delay, i) => (
                  <motion.div
                    key={i}
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay }}
                    className="w-2 h-2 rounded-full bg-violet-400"
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Suggestions Bar */}
      {messages.length > 0 && suggestions.length > 0 && !loading && (
        <div className="flex gap-2 mb-3 overflow-x-auto pb-1 shrink-0">
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => sendMessage(s)}
              className="shrink-0 px-3 py-1.5 rounded-full text-xs text-slate-400 border border-white/10 hover:border-violet-500/40 hover:text-violet-300 transition-all bg-white/3"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input Area */}
      <div className="glass-card p-3 shrink-0 flex items-center gap-3">
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
          placeholder="Ask GoGenix-AI anything about your inventory..."
          className="input-dark flex-1 px-4 py-2.5 text-sm"
          disabled={loading}
        />
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => sendMessage()}
          disabled={!input.trim() || loading}
          className="btn-primary p-2.5 rounded-xl text-white disabled:opacity-40 shrink-0"
        >
          <Send className="w-5 h-5" />
        </motion.button>
      </div>
    </div>
  );
}
