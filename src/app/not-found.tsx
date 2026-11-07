import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0c0d12] text-slate-900 dark:text-slate-100 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center text-2xl font-bold mb-4 border border-purple-500/20">
        404
      </div>
      <h1 className="text-2xl font-extrabold tracking-tight">Page or Assistant Not Found</h1>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mt-2 mb-6">
        The link you followed may be invalid or the AI assistant you're looking for does not exist.
      </p>
      <Link
        href="/"
        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-semibold shadow-md shadow-purple-600/20 hover:scale-105 transition"
      >
        Return to WΛIDE° Home
      </Link>
    </div>
  );
}
