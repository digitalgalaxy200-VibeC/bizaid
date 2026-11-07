"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function LandingPage() {
  const [displayedText, setDisplayedText] = useState("");
  const fullText =
    "Yes, we have the CeraVe Foaming Facial Cleanser in stock for ₦18,500! Island delivery to Lekki takes 24 hours. Would you like me to reserve one for you?";

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      setDisplayedText(fullText.slice(0, index));
      index++;
      if (index > fullText.length + 20) {
        index = 0;
      }
    }, 35);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0c0d12] text-slate-800 dark:text-slate-100 selection:bg-purple-600 selection:text-white font-sans antialiased transition-colors duration-200">
      {/* Subtle Ambient Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-purple-500/10 dark:bg-purple-600/15 blur-[140px] rounded-full" />
        <div className="absolute top-[600px] -left-40 w-[500px] h-[500px] bg-indigo-500/10 dark:bg-indigo-600/10 blur-[140px] rounded-full" />
      </div>

      {/* Top Navigation */}
      <header className="relative z-10 border-b border-slate-200/80 dark:border-white/5 backdrop-blur-md sticky top-0 bg-slate-50/80 dark:bg-[#0c0d12]/80 transition-colors">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-black tracking-tighter bg-gradient-to-r from-purple-700 via-indigo-600 to-purple-500 dark:from-white dark:via-slate-200 dark:to-purple-400 bg-clip-text text-transparent">
              WΛIDE°
            </span>
            <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20">
              AI Workforce
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600 dark:text-slate-300">
            <a href="#problem" className="hover:text-purple-600 dark:hover:text-white transition">The Problem</a>
            <a href="#how-it-works" className="hover:text-purple-600 dark:hover:text-white transition">How It Works</a>
            <a href="#features" className="hover:text-purple-600 dark:hover:text-white transition">Capabilities</a>
            <a href="#integrations" className="hover:text-purple-600 dark:hover:text-white transition">Channels</a>
          </nav>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              href="/auth/login"
              className="text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-purple-600 dark:hover:text-white transition hidden sm:inline-block px-3 py-2"
            >
              Sign In
            </Link>
            <Link
              href="/auth/signup"
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-md shadow-purple-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Deploy Your AI Free
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 pt-20 pb-28 px-6 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/10 dark:bg-white/5 border border-purple-500/20 dark:border-white/10 text-xs text-purple-700 dark:text-purple-300 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
            Built for small businesses & modern commerce
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.1]">
            Turn customer chats into sales,{" "}
            <span className="bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-500 dark:from-purple-400 dark:via-indigo-300 dark:to-purple-500 bg-clip-text text-transparent">
              24/7 without a website.
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            WΛIDE gives your business a trained AI employee that knows your products, prices, and policies. It answers customer questions, takes orders, and frees you to run your business.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/auth/signup"
              className="w-full sm:w-auto px-8 py-4 rounded-xl text-base font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-xl shadow-purple-600/25 transition-all hover:scale-105 active:scale-95 text-center"
            >
              Start Free Pilot Today →
            </Link>
            <a
              href="#demo"
              className="w-full sm:w-auto px-8 py-4 rounded-xl text-base font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 transition shadow-sm text-center"
            >
              Watch Live Demo
            </a>
          </div>

          <div className="flex items-center justify-center gap-6 pt-4 text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5">✓ No website required</span>
            <span className="flex items-center gap-1.5">✓ Zero code setup</span>
            <span className="flex items-center gap-1.5">✓ 1-click human takeover</span>
          </div>
        </div>

        {/* Conversational UI Interactive Preview */}
        <div id="demo" className="mt-16 max-w-4xl mx-auto">
          <div className="relative rounded-3xl p-1 bg-gradient-to-b from-purple-500/20 dark:from-purple-500/30 via-slate-200/50 dark:via-white/10 to-transparent shadow-2xl">
            <div className="bg-white dark:bg-[#12141c] rounded-[22px] overflow-hidden border border-slate-200 dark:border-white/10 shadow-lg">
              {/* Window Header */}
              <div className="bg-slate-100/80 dark:bg-slate-900/60 px-5 py-3.5 border-b border-slate-200 dark:border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-mono ml-2">chat.waide.ai/a/krish-beauty?src=whatsapp</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400" />
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">AI Active</span>
                </div>
              </div>

              {/* Chat Canvas */}
              <div className="p-6 sm:p-8 space-y-4 font-sans text-sm min-h-[380px] bg-gradient-to-b from-slate-50 to-white dark:from-[#12141c] dark:to-[#0d0e15]">
                {/* Store Intro */}
                <div className="text-center py-2">
                  <span className="text-xs px-3 py-1 rounded-full bg-purple-50 dark:bg-white/5 text-purple-700 dark:text-slate-400 border border-purple-200 dark:border-white/5 font-medium">
                    Krish Beauty • Skincare & Cosmetics Assistant
                  </span>
                </div>

                {/* Customer Message */}
                <div className="flex justify-start">
                  <div className="max-w-[80%] rounded-2xl rounded-bl-sm bg-slate-200 dark:bg-white/10 text-slate-900 dark:text-white px-4 py-3 border border-slate-300 dark:border-white/10 leading-relaxed shadow-sm">
                    Hi! Do you have the CeraVe foaming cleanser in stock? How much is it and when can you deliver to Lekki?
                  </div>
                </div>

                {/* AI Streaming Response */}
                <div className="flex justify-end">
                  <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-gradient-to-br from-purple-600 to-indigo-600 text-white px-4 py-3 shadow-lg shadow-purple-600/20 leading-relaxed">
                    <span>{displayedText}</span>
                    <span className="inline-block w-1.5 h-4 bg-white ml-1 animate-pulse align-middle" />
                  </div>
                </div>

                {/* Customer Reply */}
                {displayedText.length > 50 && (
                  <div className="flex justify-start">
                    <div className="max-w-[80%] rounded-2xl rounded-bl-sm bg-slate-200 dark:bg-white/10 text-slate-900 dark:text-white px-4 py-3 border border-slate-300 dark:border-white/10 leading-relaxed shadow-sm">
                      Yes please! My name is Chidinma, phone is 08012345678.
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Input Bar */}
              <div className="p-4 bg-slate-50 dark:bg-slate-900/40 border-t border-slate-200 dark:border-white/5 flex items-center gap-3">
                <input
                  type="text"
                  readOnly
                  placeholder="Ask about prices, shade match, delivery..."
                  className="flex-1 bg-white dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-xl px-4 py-2.5 text-xs text-slate-700 dark:text-slate-300 outline-none"
                />
                <button className="px-4 py-2.5 bg-purple-600 text-white rounded-xl text-xs font-semibold">
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Channel Integrations */}
      <section id="integrations" className="border-y border-slate-200 dark:border-white/5 bg-slate-100/60 dark:bg-white/[0.01] py-14 px-6 transition-colors">
        <div className="max-w-7xl mx-auto text-center space-y-6">
          <p className="text-xs uppercase font-bold tracking-widest text-slate-500 dark:text-slate-400">
            One AI Brain — Deployable Everywhere Your Customers Are
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-16 text-slate-600 dark:text-slate-400 text-sm font-semibold">
            <div className="flex items-center gap-2 hover:text-purple-600 dark:hover:text-white transition">
              <span className="text-xl">💬</span> WhatsApp Links & Bio
            </div>
            <div className="flex items-center gap-2 hover:text-purple-600 dark:hover:text-white transition">
              <span className="text-xl">📸</span> Instagram DMs & Bio
            </div>
            <div className="flex items-center gap-2 hover:text-purple-600 dark:hover:text-white transition">
              <span className="text-xl">🎵</span> TikTok Profile
            </div>
            <div className="flex items-center gap-2 hover:text-purple-600 dark:hover:text-white transition">
              <span className="text-xl">📱</span> In-Store QR Codes
            </div>
            <div className="flex items-center gap-2 hover:text-purple-600 dark:hover:text-white transition">
              <span className="text-xl">🌐</span> Website Chat Widget
            </div>
          </div>
        </div>
      </section>

      {/* The Core Problem We Solve */}
      <section id="problem" className="py-24 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-6">
            <span className="text-xs uppercase font-bold tracking-widest text-purple-600 dark:text-purple-400">
              The Reality of Modern Commerce
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white leading-tight">
              You are losing 40% of sales while you sleep, cook, or run errands.
            </h2>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              When a buyer messages you on Instagram or WhatsApp, they expect an answer in 3 minutes. If you reply 3 hours later, they have already bought from your competitor.
            </p>
            <div className="space-y-4 pt-2">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">✕</div>
                <p className="text-sm text-slate-700 dark:text-slate-300">Answering the same 15 questions every single day instead of fulfilling orders.</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">✕</div>
                <p className="text-sm text-slate-700 dark:text-slate-300">Missed sales inquiries arriving between 10 PM and 7 AM.</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">✕</div>
                <p className="text-sm text-slate-700 dark:text-slate-300">Customers abandoning carts because delivery fees and payment terms aren't clear.</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-100 via-indigo-50 to-white dark:from-purple-900/20 dark:to-indigo-900/10 border border-purple-200 dark:border-purple-500/20 rounded-3xl p-8 space-y-6 shadow-sm">
            <div className="text-4xl">💡</div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">The WΛIDE Solution</h3>
            <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
              A trained AI assistant that lives on a simple link in your Instagram bio or WhatsApp greeting. It understands your exact catalog, answers questions accurately, collects delivery information, and hands over to you when human warmth is needed.
            </p>
            <div className="pt-4 border-t border-purple-200 dark:border-white/10 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>0 setup fees</span>
              <span>•</span>
              <span>No tech skills required</span>
              <span>•</span>
              <span>Live in 15 minutes</span>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Capabilities Grid */}
      <section id="features" className="py-24 px-6 max-w-7xl mx-auto border-t border-slate-200 dark:border-white/5">
        <div className="text-center max-w-2xl mx-auto space-y-4 mb-16">
          <span className="text-xs uppercase font-bold tracking-widest text-purple-600 dark:text-purple-400">
            Intelligent by Design
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
            Everything your business needs to sell digitally.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FeatureCard
            icon="🌐"
            title="XML & Catalog Auto-Sync"
            desc="Plug in your WooCommerce or Google Merchant feed (like Krish Beauty's 170 products) or upload a spreadsheet. Your AI knows every price and stock change instantly."
          />
          <FeatureCard
            icon="✋"
            title="1-Click Human Takeover"
            desc="Never worry about AI mistakes. Monitor live chats from your dashboard, click 'Take Over' at any moment to chat directly, and hand back when finished."
          />
          <FeatureCard
            icon="🎓"
            title="Controlled Learning"
            desc="When customers ask questions the AI doesn't know, it never guesses. It logs the question for you to answer once, training your AI permanently."
          />
          <FeatureCard
            icon="👤"
            title="Guest-First Experience"
            desc="No app downloads or account logins required for your buyers. They click the link on mobile and start chatting immediately."
          />
          <FeatureCard
            icon="📊"
            title="Source Attribution Tracking"
            desc="Know exactly which channel drives revenue. See whether your buyers came from WhatsApp, Instagram DMs, Facebook, or in-store QR codes."
          />
          <FeatureCard
            icon="🎨"
            title="Custom Brand Identity"
            desc="Tailor your assistant's tone (warm & friendly, polished, or concise), upload your store logo, and customize colors to match your brand."
          />
        </div>
      </section>

      {/* Executive Call to Action */}
      <section className="py-24 px-6 max-w-5xl mx-auto text-center">
        <div className="relative rounded-3xl p-10 sm:p-16 bg-gradient-to-b from-purple-100 via-indigo-50 to-white dark:from-purple-600/20 dark:via-indigo-600/10 dark:to-transparent border border-purple-300/60 dark:border-purple-500/30 overflow-hidden shadow-2xl">
          <div className="relative z-10 space-y-6 max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
              Give your business its first AI employee today.
            </h2>
            <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed">
              Join visionary small business owners using WΛIDE to automate customer service, capture after-hours sales, and scale operations effortlessly.
            </p>
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/auth/signup"
                className="w-full sm:w-auto px-8 py-4 rounded-xl text-base font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-xl shadow-purple-600/30 transition-all hover:scale-105 active:scale-95"
              >
                Create Your Free AI Assistant →
              </Link>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 pt-2">
              No credit card required • Instant setup • Live support
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-white/5 py-12 px-6 text-center text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="font-bold text-slate-800 dark:text-slate-300 text-sm tracking-tight">WΛIDE°</span>
          <span>© 2026 WΛIDE Inc. An AI workforce platform for small businesses.</span>
          <div className="flex gap-6">
            <Link href="/auth/login" className="hover:text-purple-600 dark:hover:text-white transition">Business Login</Link>
            <Link href="/auth/signup" className="hover:text-purple-600 dark:hover:text-white transition">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="p-7 rounded-2xl bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 hover:border-purple-500/40 dark:hover:border-purple-500/30 hover:shadow-lg dark:hover:bg-white/[0.04] transition-all space-y-3 group shadow-sm">
      <div className="text-3xl">{icon}</div>
      <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-300 transition-colors">
        {title}
      </h3>
      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{desc}</p>
    </div>
  );
}
