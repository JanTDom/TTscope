import type { CommunicationChannel } from "@/lib/analytics/publication-rhythm";

export interface ChannelTheme {
  label: string;
  shortLabel: string;
  /** Kolor wypełnienia SVG, zgodny z kolorami stref komunikacji. */
  fill: string;
  textClass: string;
}

export const CHANNEL_THEME: Readonly<Record<CommunicationChannel, ChannelTheme>> = {
  official: {
    label: "Oficjalne komunikaty ORLEN",
    shortLabel: "ORLEN",
    fill: "oklch(0.82 0.14 210)",
    textClass: "text-cyan-300",
  },
  labor: {
    label: "Sygnały związkowe i załogi",
    shortLabel: "Związki",
    fill: "oklch(0.84 0.16 85)",
    textClass: "text-amber-300",
  },
  external: {
    label: "Publikacje w mediach zewnętrznych",
    shortLabel: "Media",
    fill: "oklch(0.70 0.14 275)",
    textClass: "text-indigo-300",
  },
};

export interface StreamFilter {
  channel?: CommunicationChannel;
  from?: string;
  to?: string;
  publisher?: string;
}

/** Adres strumienia publikacji z ustawionym filtrem. */
export function streamHref(filter: StreamFilter): string {
  const params = new URLSearchParams();
  if (filter.channel) params.set("channel", filter.channel);
  if (filter.from) params.set("from", filter.from);
  if (filter.to) params.set("to", filter.to);
  if (filter.publisher) params.set("publisher", filter.publisher);
  const query = params.toString();
  return query ? `/stream?${query}` : "/stream";
}
