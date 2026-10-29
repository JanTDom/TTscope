import { XMLParser } from "fast-xml-parser";

export interface ParsedFeedItem {
  title: string;
  link: string;
  guid?: string;
  pubDate?: string;
  author?: string;
  content: string;
  excerpt?: string;
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

  return str
    .replace(/<!\[CDATA\[(.*?)\]\]>/gs, "$1")
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
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

      if (title && link) {
        items.push({
          title,
          link,
          guid: item.guid?.__cdata || item.guid || link,
          pubDate: pubDate ? new Date(pubDate).toISOString() : undefined,
          author: author || undefined,
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
          pubDate: pubDate ? new Date(pubDate).toISOString() : undefined,
          author: author || undefined,
          content: content || title,
          excerpt: content.length > 280 ? content.slice(0, 280) + "..." : content,
        });
      }
    }
  }

  return items;
}
