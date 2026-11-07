"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (res?.error) {
        setError("Invalid email or password");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err: any) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0c0d12] text-slate-900 dark:text-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative selection:bg-purple-600 selection:text-white transition-colors duration-200">
      <div className="absolute top-6 right-6">
        <ThemeToggle />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-block text-3xl font-black tracking-tighter bg-gradient-to-r from-purple-700 via-indigo-600 to-purple-500 dark:from-white dark:via-slate-200 dark:to-purple-400 bg-clip-text text-transparent">
          WΛIDE°
        </Link>
        <h2 className="mt-2 text-xl font-bold text-slate-800 dark:text-slate-200">
          Sign in to your business hub
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Manage your AI assistant, catalog, and live chats
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white dark:bg-[#12141c] py-8 px-6 sm:px-10 shadow-xl rounded-2xl border border-slate-200 dark:border-white/10">
          {error && (
            <div className="mb-4 bg-rose-500/10 border border-rose-500/20 p-3 text-sm text-rose-600 dark:text-rose-400 rounded-xl">
              {error}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">Email address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-white/5 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                placeholder="owner@yourbusiness.com"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-white/5 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-md shadow-purple-600/20 disabled:opacity-50 transition-all hover:scale-[1.01]"
            >
              {loading ? "Signing in..." : "Sign in to Dashboard →"}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
            Don't have an account?{" "}
            <Link href="/auth/signup" className="font-semibold text-purple-600 dark:text-purple-400 hover:underline">
              Register your business free
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
