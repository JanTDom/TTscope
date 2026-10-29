import { describe, it, expect } from "vitest";
import { cleanText, decodeHtmlEntities, parseRssOrAtom } from "../ingest/parser";

describe("TTscope Feed & HTML Parser", () => {
  it("powinien prawidłowo dekodować encje numeryczne i polskie cudzysłowy (np. NSZZ Solidarność)", () => {
    const raw = "NSZZ &#8222;Solidarność&#8221; oraz wielokropek w&#8230; tekście";
    const cleaned = cleanText(raw);
    expect(cleaned).toBe("NSZZ „Solidarność” oraz wielokropek w… tekście");
  });

  it("powinien prawidłowo czyścić tagi HTML i encje nazwane", () => {
    const raw = "<div><p>Oświadczenie <strong>ORLEN S.A.</strong> &amp; decyzja &quot;UOKiK&quot; &bdquo;cytat&rdquo;.</p></div>";
    const cleaned = cleanText(raw);
    expect(cleaned).toBe('Oświadczenie ORLEN S.A. & decyzja "UOKiK" „cytat”.');
  });

  it("powinien dekodować encje szesnastkowe (np. emoji lub znaki specjalne)", () => {
    const raw = "Raport &#x1f4ca; i cudzysłów &#x201e;test&#x201d;";
    const cleaned = cleanText(raw);
    expect(cleaned).toBe("Raport 📊 i cudzysłów „test”");
  });

  it("powinien neutralizować skrypty (ochrona XSS)", () => {
    const malicious = "<script>alert('xss')</script>Normalna treść komunikatu";
    const cleaned = cleanText(malicious);
    expect(cleaned).toBe("Normalna treść komunikatu");
    expect(cleaned).not.toContain("alert");
  });

  it("powinien poprawnie przetwarzać strukturę RSS 2.0 i dekodować encje w tytułach", () => {
    const xml = `
      <rss version="2.0">
        <channel>
          <title>Biuro Prasowe ORLEN</title>
          <link>https://orlen.pl</link>
          <item>
            <title><![CDATA[Nowy Zarząd ORLEN S.A. &#8211; oświadczenie]]></title>
            <link>https://orlen.pl/komunikat-1</link>
            <description>Informacja o zmianach &#8222;w organach&#8221; spółki.</description>
            <pubDate>Thu, 29 Oct 2026 12:00:00 GMT</pubDate>
          </item>
        </channel>
      </rss>
    `;

    const items = parseRssOrAtom(xml);
    expect(items.length).toBe(1);
    expect(items[0].title).toBe("Nowy Zarząd ORLEN S.A. – oświadczenie");
    expect(items[0].link).toBe("https://orlen.pl/komunikat-1");
    expect(items[0].content).toBe("Informacja o zmianach „w organach” spółki.");
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
