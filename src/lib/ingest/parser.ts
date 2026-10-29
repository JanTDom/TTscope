import { XMLParser } from "fast-xml-parser";

export interface ParsedFeedItem {
  title: string;
  link: string;
  guid?: string;
  pubDate?: string;
  author?: string;
  publisherName?: string;
  content: string;
  excerpt?: string;
}

const COMMON_NAMED_ENTITIES: Readonly<Record<string, string>> = {
  quot: '"',
  amp: "&",
  apos: "'",
  lt: "<",
  gt: ">",
  nbsp: " ",
  bdquo: "„",
  ldquo: "“",
  rdquo: "”",
  sbquo: "‚",
  lsquo: "‘",
  rsquo: "’",
  laquo: "«",
  raquo: "»",
  hellip: "…",
  ndash: "–",
  mdash: "—",
  bull: "•",
  copy: "©",
  reg: "®",
  trade: "™",
  euro: "€",
  pound: "£",
  yen: "¥",
  deg: "°",
  plusmn: "±",
  times: "×",
  divide: "÷",
  micro: "µ",
  middot: "·",
};

/**
 * Pełne dekodowanie encji HTML:
 * 1. Numeryczne dziesiętne (np. &#8222; -> „, &#8221; -> ”, &#8230; -> …)
 * 2. Numeryczne szesnastkowe (np. &#x201e; -> „, &#x1f4ca; -> 📊)
 * 3. Nazwane (np. &bdquo;, &rdquo;, &amp;, &quot;, &nbsp;)
 */
export function decodeHtmlEntities(text: string): string {
  if (!text) return "";
  return text
    // Numeryczne dziesiętne
    .replace(/&#(\d+);?/g, (_, dec) => {
      const code = parseInt(dec, 10);
      return code > 0 && code < 0x10ffff ? String.fromCodePoint(code) : "";
    })
    // Numeryczne szesnastkowe
    .replace(/&#x([0-9a-f]+);?/gi, (_, hex) => {
      const code = parseInt(hex, 16);
      return code > 0 && code < 0x10ffff ? String.fromCodePoint(code) : "";
    })
    // Nazwane
    .replace(/&([a-z0-9]+);/gi, (full, name) => {
      const lower = name.toLowerCase();
      return COMMON_NAMED_ENTITIES[lower] || full;
    });
}

export function cleanText(htmlOrText: unknown): string {
  if (!htmlOrText) return "";
  let str = "";
  if (typeof htmlOrText === "string") {
    str = htmlOrText;
  } else if (typeof htmlOrText === "object" && htmlOrText !== null) {
    const obj = htmlOrText as Record<string, any>;
    str = String(obj.__cdata || obj["#text"] || obj.title || "");
  } else {
    str = String(htmlOrText);
  }

  // 1. Usunięcie CDATA i bloków technicznych
  str = str
    .replace(/<!\[CDATA\[(.*?)\]\]>/gs, "$1")
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ");

  // 2. Dekodowanie encji HTML
  str = decodeHtmlEntities(str);

  // 3. Normalizacja białych znaków i usunięcie zbędnych spacji
  return str.replace(/\s+/g, " ").trim();
}

export function parseFlexibleDate(rawDate: unknown): string | undefined {
  if (!rawDate) return undefined;
  const str = String(rawDate).trim();
  if (!str) return undefined;

  // 1. Standardowe parsowanie ISO / RFC822
  const direct = new Date(str);
  if (!isNaN(direct.getTime())) {
    return direct.toISOString();
  }

  // 2. Format "HH:mm DD.MM.YYYY" lub "DD.MM.YYYY HH:mm" lub "DD.MM.YYYY"
  const plMatch = str.match(/(?:(\d{1,2}):(\d{2})\s+)?(\d{2})\.(\d{2})\.(\d{4})(?:\s+(\d{1,2}):(\d{2}))?/);
  if (plMatch) {
    const hours = Number(plMatch[1] || plMatch[6] || 12);
    const minutes = Number(plMatch[2] || plMatch[7] || 0);
    const day = Number(plMatch[3]);
    const month = Number(plMatch[4]) - 1;
    const year = Number(plMatch[5]);
    const customDate = new Date(year, month, day, hours, minutes, 0);
    if (!isNaN(customDate.getTime())) {
      return customDate.toISOString();
    }
  }

  return undefined;
}

export function parseRssOrAtom(xmlContent: string): ParsedFeedItem[] {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    textNodeName: "#text",
    cdataPropName: "__cdata",
  });

  const parsed = parser.parse(xmlContent);
  const items: ParsedFeedItem[] = [];

  // 1. Format RSS 2.0 (<rss><channel><item>)
  const rssChannel = parsed.rss?.channel;
  if (rssChannel && rssChannel.item) {
    const rawItems = Array.isArray(rssChannel.item) ? rssChannel.item : [rssChannel.item];
    for (const item of rawItems) {
      const title = cleanText(item.title?.__cdata || item.title || "");
      const link = (item.link?.__cdata || item.link || "").trim();
      const content = cleanText(
        item["content:encoded"]?.__cdata ||
        item["content:encoded"] ||
        item.description?.__cdata ||
        item.description ||
        ""
      );
      const pubDate = item.pubDate || item.date || item["dc:date"];
      const author = cleanText(item.author || item["dc:creator"] || "");
      const publisherName = cleanText(item.source?.["#text"] || item.source || "");

      if (title && link) {
        items.push({
          title,
          link,
          guid: item.guid?.__cdata || item.guid || link,
          pubDate: parseFlexibleDate(pubDate),
          author: author || undefined,
          publisherName: publisherName || undefined,
          content: content || title,
          excerpt: content.length > 280 ? content.slice(0, 280) + "..." : content,
        });
      }
    }
    return items;
  }

  // 2. Format Atom (<feed><entry>)
  const atomFeed = parsed.feed;
  if (atomFeed && atomFeed.entry) {
    const rawEntries = Array.isArray(atomFeed.entry) ? atomFeed.entry : [atomFeed.entry];
    for (const entry of rawEntries) {
      const title = cleanText(entry.title?.__cdata || entry.title || "");
      let link = "";
      if (typeof entry.link === "string") {
        link = entry.link;
      } else if (Array.isArray(entry.link)) {
        const alt = entry.link.find((l: any) => l["@_rel"] === "alternate") || entry.link[0];
        link = alt?.["@_href"] || "";
      } else if (entry.link?.["@_href"]) {
        link = entry.link["@_href"];
      }

      const content = cleanText(
        entry.content?.__cdata ||
        entry.content?.["#text"] ||
        entry.summary?.__cdata ||
        entry.summary?.["#text"] ||
        entry.title ||
        ""
      );

      const pubDate = entry.published || entry.updated;
      const author = cleanText(entry.author?.name || "");

      if (title && link) {
        items.push({
          title,
          link,
          guid: entry.id || link,
          pubDate: parseFlexibleDate(pubDate),
          author: author || undefined,
          content: content || title,
          excerpt: content.length > 280 ? content.slice(0, 280) + "..." : content,
        });
      }
    }
  }

  return items;
}
