import { describe, it, expect } from "vitest";
import { cleanText, parseRssOrAtom } from "../ingest/parser";

describe("TTscope Feed & HTML Parser", () => {
  it("powinien prawidłowo czyścić tagi HTML i encje", () => {
    const raw = "<div><p>Oświadczenie <strong>ORLEN S.A.</strong> &amp; decyzja &quot;UOKiK&quot;.</p></div>";
    const cleaned = cleanText(raw);
    expect(cleaned).toBe('Oświadczenie ORLEN S.A. & decyzja "UOKiK".');
  });

  it("powinien neutralizować skrypty (ochrona XSS)", () => {
    const malicious = "<script>alert('xss')</script>Normalna treść komunikatu";
    const cleaned = cleanText(malicious);
    expect(cleaned).toBe("Normalna treść komunikatu");
    expect(cleaned).not.toContain("alert");
  });

  it("powinien poprawnie przetwarzać strukturę RSS 2.0", () => {
    const xml = `
      <rss version="2.0">
        <channel>
          <title>Biuro Prasowe ORLEN</title>
          <link>https://orlen.pl</link>
          <item>
            <title><![CDATA[Nowy Zarząd ORLEN S.A.]]></title>
            <link>https://orlen.pl/komunikat-1</link>
            <description>Informacja o zmianach w organach spółki.</description>
            <pubDate>Thu, 29 Oct 2026 12:00:00 GMT</pubDate>
          </item>
        </channel>
      </rss>
    `;

    const items = parseRssOrAtom(xml);
    expect(items.length).toBe(1);
    expect(items[0].title).toBe("Nowy Zarząd ORLEN S.A.");
    expect(items[0].link).toBe("https://orlen.pl/komunikat-1");
    expect(items[0].content).toContain("Informacja o zmianach");
  });

  it("powinien poprawnie przetwarzać strukturę Atom", () => {
    const atomXml = `
      <feed xmlns="http://www.w3.org/2005/Atom">
        <title>Energa Media</title>
        <entry>
          <title>Modernizacja sieci w Gdańsku</title>
          <link rel="alternate" href="https://energa.pl/artykul-1"/>
          <summary>Rozbudowa infrastruktury dystrybucyjnej.</summary>
          <updated>2026-10-29T10:00:00Z</updated>
        </entry>
      </feed>
    `;

    const items = parseRssOrAtom(atomXml);
    expect(items.length).toBe(1);
    expect(items[0].title).toBe("Modernizacja sieci w Gdańsku");
    expect(items[0].link).toBe("https://energa.pl/artykul-1");
  });
});
