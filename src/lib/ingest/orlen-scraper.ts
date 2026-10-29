// ==============================================================================
// TTscope — Dedykowany Scraper Komunikatów Prasowych Newsroomu ORLEN S.A.
// ==============================================================================

import type { ParsedFeedItem } from "./parser";

const ORLEN_NEWSROOM_URL = "https://www.orlen.pl/pl/o-firmie/media/komunikaty-prasowe";

export async function scrapeOrlenNewsroom(): Promise<ParsedFeedItem[]> {
  const res = await fetch(ORLEN_NEWSROOM_URL, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "pl,en-US;q=0.9,en;q=0.8",
    },
  });

  if (!res.ok) {
    throw new Error(`Błąd HTTP ${res.status} (${res.statusText}) podczas pobierania newsroomu ORLEN`);
  }

  const html = await res.text();
  const regex = /<a[^>]+href="([^"]*\/komunikaty-prasowe\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  let match: RegExpExecArray | null;
  const items: ParsedFeedItem[] = [];

  while ((match = regex.exec(html)) !== null) {
    const rawLink = match[1];
    const innerHtml = match[2];

    const titleMatch = innerHtml.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i);
    const dateMatch = innerHtml.match(/<span[^>]*cmp-tilelist__item-date[^>]*>([\s\S]*?)<\/span>/i);
    const descMatch = innerHtml.match(/<p[^>]*cmp-tilelist__item-description[^>]*>([\s\S]*?)<\/p>/i);

    if (titleMatch) {
      const title = titleMatch[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
      const rawDate = dateMatch ? dateMatch[1].replace(/<[^>]+>/g, "").trim() : null;
      const desc = descMatch ? descMatch[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim() : "";
      const fullUrl = rawLink.startsWith("http") ? rawLink : `https://www.orlen.pl${rawLink}`;

      let isoDate: string | undefined = undefined;
      if (rawDate) {
        // Format dd.MM.yyyy
        const parts = rawDate.split(".");
        if (parts.length === 3) {
          const d = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]), 12, 0, 0);
          if (!isNaN(d.getTime())) {
            isoDate = d.toISOString();
          }
        }
      }

      if (title && !items.some((i) => i.link === fullUrl)) {
        items.push({
          title,
          link: fullUrl,
          guid: fullUrl,
          pubDate: isoDate,
          author: "Biuro Prasowe ORLEN S.A.",
          content: desc || title,
          excerpt: desc.length > 280 ? desc.slice(0, 280) + "..." : desc,
        });
      }
    }
  }

  return items;
}
