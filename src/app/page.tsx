export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-waide-950 text-white p-8">
      <div className="text-center space-y-6 max-w-md">
        <h1 className="text-5xl font-bold tracking-tight">WΛIDE°</h1>
        <p className="text-waide-200 text-lg">
          AI workforce platform for small businesses.
        </p>
        <div className="flex gap-4 justify-center pt-4">
          <a
            href="/dashboard"
            className="bg-waide-500 hover:bg-waide-400 text-white px-6 py-3 rounded-xl font-medium transition-colors"
          >
            Business Login
          </a>
        </div>
      </div>
    </main>
  );
}
