/**
 * WΛIDE° Multi-Source Knowledge & Product Ingestion API
 * POST /api/knowledge/import
 * Supports:
 * - "xml_feed": Parses Google Merchant / WooCommerce XML feeds
 * - "csv_text": Parses CSV / Google Sheet exported rows
 * - "raw_text": Chunks unstructured text into knowledge items
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { getTenantDbBySlug } from "@/lib/db/tenant";
import { products, knowledgeItems } from "../../../../../drizzle/schema/tenant";
import { nanoid } from "nanoid";
import { z } from "zod";

const ImportRequestSchema = z.object({
  sourceType: z.enum(["xml_feed", "csv_text", "raw_text", "google_sheet_url"]),
  data: z.string().min(1), // URL or raw content
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const tenantSlug = (session as any)?.tenantSlug;

    if (!session || !tenantSlug) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { sourceType, data } = ImportRequestSchema.parse(body);
    const tenantDb = await getTenantDbBySlug(tenantSlug);
    const now = new Date();

    // ========================================================
    // 1. XML FEED (Google Merchant Center / WooCommerce)
    // ========================================================
    if (sourceType === "xml_feed") {
      const feedUrl = data.trim();
      const res = await fetch(feedUrl, {
        headers: { "User-Agent": "WAIDE-Product-Importer/1.0" },
      });

      if (!res.ok) {
        return NextResponse.json({ error: `Failed to fetch XML feed (status ${res.status})` }, { status: 400 });
      }

      const xmlText = await res.text();
      const importedProducts = parseXmlFeed(xmlText, now);

      if (importedProducts.length === 0) {
        return NextResponse.json({ error: "No products found in the provided XML feed." }, { status: 400 });
      }

      // Batch insert products
      for (const chunk of chunkArray(importedProducts, 50)) {
        await tenantDb.insert(products).values(chunk);
      }

      return NextResponse.json({
        success: true,
        count: importedProducts.length,
        message: `Successfully imported ${importedProducts.length} products from XML feed!`,
      });
    }

    // ========================================================
    // 2. CSV / GOOGLE SHEET EXPORT
    // ========================================================
    if (sourceType === "csv_text") {
      const lines = data.split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (lines.length < 2) {
        return NextResponse.json({ error: "CSV must contain at least a header row and one data row." }, { status: 400 });
      }

      const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
      const nameIdx = headers.findIndex((h) => h.includes("name") || h.includes("title") || h.includes("product"));
      const priceIdx = headers.findIndex((h) => h.includes("price") || h.includes("cost") || h.includes("amount"));
      const descIdx = headers.findIndex((h) => h.includes("desc"));
      const catIdx = headers.findIndex((h) => h.includes("cat"));
      const stockIdx = headers.findIndex((h) => h.includes("stock") || h.includes("avail"));

      if (nameIdx === -1) {
        return NextResponse.json({ error: "Could not find a 'Product Name' or 'Title' column in your CSV." }, { status: 400 });
      }

      const importedProducts = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = parseCsvLine(lines[i]);
        const name = cols[nameIdx]?.trim();
        if (!name) continue;

        const rawPrice = priceIdx !== -1 ? cols[priceIdx]?.replace(/[^0-9.]/g, "") : null;
        const price = rawPrice ? parseFloat(rawPrice) : null;
        const description = descIdx !== -1 ? cols[descIdx]?.trim() : null;
        const category = catIdx !== -1 ? cols[catIdx]?.trim() : "General";
        const inStockText = stockIdx !== -1 ? cols[stockIdx]?.trim().toLowerCase() : "yes";
        const inStock = inStockText === "yes" || inStockText === "true" || inStockText === "1" || inStockText === "in stock";

        importedProducts.push({
          id: nanoid(),
          name,
          description: description || null,
          category: category || "General",
          price: isNaN(price as any) ? null : price,
          currency: "NGN",
          unit: null,
          inStock,
          imageUrl: null,
          variants: null,
          isActive: true,
          createdAt: now,
          updatedAt: now,
        });
      }

      for (const chunk of chunkArray(importedProducts, 50)) {
        await tenantDb.insert(products).values(chunk);
      }

      return NextResponse.json({
        success: true,
        count: importedProducts.length,
        message: `Successfully imported ${importedProducts.length} products from CSV!`,
      });
    }

    // ========================================================
    // 3. RAW TEXT / UNSTRUCTURED NOTES
    // ========================================================
    if (sourceType === "raw_text") {
      // Split into paragraphs / topics
      const paragraphs = data
        .split(/\n\s*\n/)
        .map((p) => p.trim())
        .filter((p) => p.length >= 20);

      const items = paragraphs.map((para) => {
        // Detect if line starts with Q: / Question:
        const isFaq = /^q(uestion)?[:.]/i.test(para);
        let question: string | null = null;
        let answer = para;

        if (isFaq) {
          const parts = para.split(/\na(nswer)?[:.]/i);
          if (parts.length >= 2) {
            question = parts[0].replace(/^q(uestion)?[:.]\s*/i, "").trim();
            answer = parts[1].trim();
          }
        }

        return {
          id: nanoid(),
          type: question ? "faq" : "info",
          question,
          answer,
          category: "General Notes",
          tags: "raw-import",
          isActive: true,
          createdAt: now,
          updatedAt: now,
        };
      });

      for (const chunk of chunkArray(items, 50)) {
        await tenantDb.insert(knowledgeItems).values(chunk);
      }

      return NextResponse.json({
        success: true,
        count: items.length,
        message: `Successfully parsed and saved ${items.length} knowledge items from raw text!`,
      });
    }

    return NextResponse.json({ error: "Unsupported source type" }, { status: 400 });
  } catch (error: any) {
    console.error("[api/knowledge/import] Error:", error);
    return NextResponse.json({ error: error.message || "Import failed" }, { status: 500 });
  }
}

// Simple XML item extractor (compatible with RSS / Google Merchant feeds)
function parseXmlFeed(xml: string, now: Date) {
  const items: any[] = [];
  const itemMatches = xml.match(/<item[\s\S]*?<\/item>/gi) || [];

  for (const itemXml of itemMatches) {
    const titleMatch = itemXml.match(/<(?:g:)?title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/(?:g:)?title>/i);
    const descMatch = itemXml.match(/<(?:g:)?description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/(?:g:)?description>/i);
    const priceMatch = itemXml.match(/<(?:g:)?price>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/(?:g:)?price>/i);
    const availMatch = itemXml.match(/<(?:g:)?availability>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/(?:g:)?availability>/i);
    const imageMatch = itemXml.match(/<(?:g:)?image_link>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/(?:g:)?image_link>/i);
    const catMatch = itemXml.match(/<(?:g:)?product_type>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/(?:g:)?product_type>/i);

    const name = titleMatch ? cleanText(titleMatch[1]) : null;
    if (!name) continue;

    const rawPrice = priceMatch ? priceMatch[1].replace(/[^0-9.]/g, "") : null;
    const price = rawPrice ? parseFloat(rawPrice) : null;
    const availText = availMatch ? availMatch[1].toLowerCase() : "in stock";
    const inStock = !availText.includes("out of stock");

    items.push({
      id: nanoid(),
      name,
      description: descMatch ? cleanText(descMatch[1]) : null,
      category: catMatch ? cleanText(catMatch[1]) : "Skincare & Beauty",
      price: isNaN(price as any) ? null : price,
      currency: "NGN",
      unit: null,
      inStock,
      imageUrl: imageMatch ? imageMatch[1].trim() : null,
      variants: null,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  }

  return items;
}

function cleanText(str: string): string {
  return str.replace(/<[^>]*>/g, "").trim();
}

function parseCsvLine(line: string): string[] {
  const result = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"' && (i === 0 || line[i - 1] !== "\\")) {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}
