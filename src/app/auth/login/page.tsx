"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction } from "./actions";
import { ThemeToggle } from "@/components/ThemeToggle";
import { PasswordInput } from "@/components/PasswordInput";

export default function LoginPage() {
  const [errorMessage, formAction, isPending] = useActionState(loginAction, undefined);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0c0d12] text-slate-900 dark:text-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative selection:bg-purple-600 selection:text-white transition-colors duration-200">
      {/* Subtle Ambient Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-purple-500/10 dark:bg-purple-600/15 blur-[140px] rounded-full" />
        <div className="absolute top-[500px] -left-20 w-[400px] h-[400px] bg-indigo-500/10 dark:bg-indigo-600/10 blur-[140px] rounded-full" />
      </div>

      {/* Top Controls */}
      <div className="absolute top-6 right-6 z-10 flex items-center gap-3">
        <ThemeToggle />
        <Link
          href="/"
          className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-white px-3 py-2 rounded-lg bg-white/60 dark:bg-white/5 border border-slate-200 dark:border-white/10 transition"
        >
          ← Back to Home
        </Link>
      </div>

      {/* Logo Header */}
      <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link
          href="/"
          className="inline-block text-3xl font-black tracking-tighter bg-gradient-to-r from-purple-700 via-indigo-600 to-purple-500 dark:from-white dark:via-slate-200 dark:to-purple-400 bg-clip-text text-transparent"
        >
          WΛIDE°
        </Link>
        <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Sign in to your business hub
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Monitor conversations, manage your catalog, and control your AI assistant
        </p>
      </div>

      {/* Login Card */}
      <div className="relative z-10 mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="relative rounded-3xl p-1 bg-gradient-to-b from-purple-500/20 dark:from-purple-500/30 via-slate-200/50 dark:via-white/10 to-transparent shadow-2xl">
          <div className="bg-white dark:bg-[#12141c] py-8 px-6 sm:px-10 rounded-[22px] border border-slate-200 dark:border-white/10 shadow-lg">
            {errorMessage && (
              <div className="mb-5 bg-rose-500/10 border border-rose-500/20 p-3.5 text-xs font-semibold text-rose-600 dark:text-rose-400 rounded-xl flex items-center gap-2">
                <span>⚠️</span>
                <span>{errorMessage}</span>
              </div>
            )}

            <form action={formAction} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="owner@krishbeauty.com"
                  className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Password
                  </label>
                </div>
                <PasswordInput
                  name="password"
                  required
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full mt-2 py-3 px-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-lg shadow-purple-600/25 disabled:opacity-50 transition-all hover:scale-[1.01] active:scale-[0.99]"
              >
                {isPending ? "Signing in..." : "Sign in to Dashboard →"}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-slate-200 dark:border-white/5 text-center text-xs text-slate-500 dark:text-slate-400">
              New to WΛIDE?{" "}
              <Link
                href="/auth/signup"
                className="font-bold text-purple-600 dark:text-purple-400 hover:underline"
              >
                Register your business free →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
