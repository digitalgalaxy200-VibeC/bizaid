"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type SourceType = "xml_feed" | "csv_text" | "raw_text";

interface SourceOption {
  id: SourceType;
  title: string;
  icon: string;
  badge: string;
  description: string;
  samplePlaceholder: string;
  sampleTemplate: string;
}

const SOURCES: SourceOption[] = [
  {
    id: "xml_feed",
    title: "Live XML / Google Merchant Feed",
    icon: "🌐",
    badge: "Recommended for Krish Beauty",
    description: "Connect your WooCommerce, Shopify, or Google Shopping product XML link. We automatically parse titles, prices (NGN), stock, and descriptions.",
    samplePlaceholder: "https://krishbeauty.com.ng/wp-content/uploads/rex-feed/feed-16287.xml",
    sampleTemplate: `Example URL:
https://krishbeauty.com.ng/wp-content/uploads/rex-feed/feed-16287.xml

Supported formats:
- Google Merchant Center RSS / XML
- WooCommerce Product Feeds (RexTheme / CTX Feed / WebToffee)
- Standard RSS 2.0 Product Feeds`,
  },
  {
    id: "csv_text",
    title: "Google Sheets / CSV Spreadsheet",
    icon: "📊",
    badge: "Inventory & Price Lists",
    description: "Export your Google Sheet or Excel file as a CSV and paste it here. Perfect for managing large catalogs with prices, categories, and stock status.",
    samplePlaceholder: `Product Name,Price,Category,In Stock,Description
CeraVe Foaming Facial Cleanser,18500,Cleansers,Yes,For normal to oily skin 473ml
La Roche-Posay Anthelios SPF 50,24000,Sunscreens,Yes,Invisible fluid sun protection 50ml
The Ordinary Niacinamide 10%,9500,Serums,No,High-strength vitamin and mineral blemish formula`,
    sampleTemplate: `Header Columns Expected:
Product Name,Price,Category,In Stock,Description

Example Row:
CeraVe Moisturizing Cream,22000,Moisturizers,Yes,Rich barrier cream for dry skin 453g`,
  },
  {
    id: "raw_text",
    title: "Raw Text / WhatsApp Notes & FAQs",
    icon: "📝",
    badge: "Fastest Setup",
    description: "Copy and paste your WhatsApp auto-replies, Instagram captions, store policies, or FAQs. The system chunks them into searchable knowledge items.",
    samplePlaceholder: `Q: What are your delivery fees in Lagos?
A: Island delivery (Lekki, VI, Ikoyi) is ₦2,500. Mainland delivery is ₦3,500. Same-day delivery is available for orders placed before 1:00 PM.

Q: Do you offer payment on delivery?
A: We only accept bank transfer before dispatch for interstate orders. Lagos orders can pay on delivery.

Store Location: 14 Admiralty Way, Lekki Phase 1, Lagos. Open Monday to Saturday 9am - 7pm.`,
    sampleTemplate: `Structure your notes with Q: and A: for FAQs, or simple paragraphs for general store policies:

Q: How do I place an order?
A: You can place an order directly by sending your product name, delivery address, and phone number to us here.`,
  },
];

export default function KnowledgeImportPage() {
  const router = useRouter();
  const [selectedSource, setSelectedSource] = useState<SourceType>("xml_feed");
  const [inputData, setInputData] = useState(
    "https://krishbeauty.com.ng/wp-content/uploads/rex-feed/feed-16287.xml"
  );
  const [showSample, setShowSample] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const activeSource = SOURCES.find((s) => s.id === selectedSource)!;

  const handleSourceSelect = (type: SourceType) => {
    setSelectedSource(type);
    setResult(null);
    if (type === "xml_feed") {
      setInputData("https://krishbeauty.com.ng/wp-content/uploads/rex-feed/feed-16287.xml");
    } else {
      setInputData("");
    }
  };

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputData.trim()) return;

    setImporting(true);
    setResult(null);

    try {
      const res = await fetch("/api/knowledge/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceType: selectedSource,
          data: inputData,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to import knowledge");
      }

      setResult({
        success: true,
        message: data.message || `Successfully imported data!`,
      });
    } catch (err: any) {
      setResult({
        success: false,
        message: err.message || "An unexpected error occurred during import.",
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-white border-r border-gray-200 p-6 flex flex-col justify-between hidden md:flex shrink-0">
        <div className="space-y-6">
          <Link href="/dashboard" className="text-2xl font-black text-waide-900 tracking-tight">
            WΛIDE°
          </Link>
          <nav className="space-y-1">
            <Link
              href="/dashboard"
              className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg text-gray-700 hover:bg-gray-100"
            >
              📊 Overview
            </Link>
            <Link
              href="/dashboard/conversations"
              className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg text-gray-700 hover:bg-gray-100"
            >
              💬 Conversations
            </Link>
            <Link
              href="/dashboard/knowledge"
              className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg bg-waide-50 text-waide-700 font-semibold"
            >
              📚 Knowledge Base
            </Link>
            <Link
              href="/dashboard/settings"
              className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg text-gray-700 hover:bg-gray-100"
            >
              ⚙️ Settings
            </Link>
          </nav>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-10 max-w-5xl mx-auto overflow-y-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-200">
          <div>
            <div className="flex items-center gap-3">
              <Link href="/dashboard/knowledge" className="text-sm text-waide-600 hover:underline">
                ← Knowledge Base
              </Link>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mt-2">Import Products & Knowledge</h1>
            <p className="text-sm text-gray-500 mt-1">
              Select your source below to automatically train your AI with your full catalog, prices, and FAQs.
            </p>
          </div>
        </div>

        {/* Source Selector Cards */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          {SOURCES.map((s) => {
            const isSelected = selectedSource === s.id;
            return (
              <div
                key={s.id}
                onClick={() => handleSourceSelect(s.id)}
                className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                  isSelected
                    ? "border-waide-600 bg-white ring-2 ring-waide-500/20 shadow-md"
                    : "border-gray-200 bg-white hover:border-gray-300 shadow-sm"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-3xl">{s.icon}</span>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      isSelected ? "bg-waide-100 text-waide-800" : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {s.badge}
                  </span>
                </div>
                <h3 className="font-bold text-gray-900 text-sm mb-1">{s.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{s.description}</p>
              </div>
            );
          })}
        </div>

        {/* Status Message */}
        {result && (
          <div
            className={`mt-6 p-4 rounded-xl text-sm font-medium flex items-center justify-between ${
              result.success
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            <span>{result.message}</span>
            {result.success && (
              <Link
                href="/dashboard/knowledge"
                className="underline text-emerald-900 font-bold ml-4 text-xs"
              >
                View Knowledge Items →
              </Link>
            )}
          </div>
        )}

        {/* Data Input Form */}
        <form onSubmit={handleImport} className="mt-6 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-bold text-gray-900">
              {selectedSource === "xml_feed" ? "Paste Product XML Feed URL:" : "Paste Your Data:"}
            </label>
            <button
              type="button"
              onClick={() => setShowSample(!showSample)}
              className="text-xs font-semibold text-waide-600 hover:text-waide-700"
            >
              {showSample ? "Hide Sample Template" : "👁 View Sample Template"}
            </button>
          </div>

          {showSample && (
            <div className="bg-gray-900 text-emerald-400 p-4 rounded-xl text-xs font-mono whitespace-pre-wrap leading-relaxed">
              {activeSource.sampleTemplate}
            </div>
          )}

          {selectedSource === "xml_feed" ? (
            <input
              type="url"
              required
              value={inputData}
              onChange={(e) => setInputData(e.target.value)}
              placeholder={activeSource.samplePlaceholder}
              className="w-full rounded-xl border border-gray-300 p-3 text-sm focus:border-waide-500 focus:outline-none"
            />
          ) : (
            <textarea
              required
              rows={8}
              value={inputData}
              onChange={(e) => setInputData(e.target.value)}
              placeholder={activeSource.samplePlaceholder}
              className="w-full rounded-xl border border-gray-300 p-3 text-sm font-mono focus:border-waide-500 focus:outline-none"
            />
          )}

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-gray-400">
              {selectedSource === "xml_feed"
                ? "This will fetch all active products and update their stock status in real-time."
                : "Imported items will immediately be indexed for AI customer chat."}
            </span>
            <button
              type="submit"
              disabled={importing || !inputData.trim()}
              className="px-6 py-2.5 bg-waide-600 hover:bg-waide-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold shadow-sm transition"
            >
              {importing ? "Processing & Ingesting..." : "Import Knowledge Now"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
