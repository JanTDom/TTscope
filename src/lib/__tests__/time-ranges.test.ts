import { describe, expect, it } from "vitest";
import {
  isTimeRangePreset,
  resolveTimeRange,
  buildTimeRangeParams,
} from "../analytics/time-ranges";

describe("time-ranges", () => {
  const reference = "2026-10-29T14:27:00.000Z";

  it("poprawnie rozpoznaje prawidłowe presety", () => {
    expect(isTimeRangePreset("1h")).toBe(true);
    expect(isTimeRangePreset("8h")).toBe(true);
    expect(isTimeRangePreset("24h")).toBe(true);
    expect(isTimeRangePreset("7d")).toBe(true);
    expect(isTimeRangePreset("30d")).toBe(true);
    expect(isTimeRangePreset("all")).toBe(true);
    expect(isTimeRangePreset("custom")).toBe(true);
    expect(isTimeRangePreset("invalid")).toBe(false);
  });

  it("rozwiązuje domyślny preset 24h względem czasu referencyjnego", () => {
    const res = resolveTimeRange({}, reference);
    expect(res.preset).toBe("24h");
    expect(res.isCustom).toBe(false);
    expect(new Date(res.fromIso).getTime()).toBe(new Date(reference).getTime() - 24 * 3600000);
  });

  it("rozwiązuje preset 1h i 8h", () => {
    const res1 = resolveTimeRange({ preset: "1h" }, reference);
    expect(res1.preset).toBe("1h");
    expect(new Date(res1.fromIso).getTime()).toBe(new Date(reference).getTime() - 1 * 3600000);

    const res8 = resolveTimeRange({ preset: "8h" }, reference);
    expect(res8.preset).toBe("8h");
    expect(new Date(res8.fromIso).getTime()).toBe(new Date(reference).getTime() - 8 * 3600000);
  });

  it("rozwiązuje preset 7d i 30d", () => {
    const res7 = resolveTimeRange({ preset: "7d" }, reference);
    expect(res7.preset).toBe("7d");
    expect(new Date(res7.fromIso).getTime()).toBe(new Date(reference).getTime() - 7 * 24 * 3600000);

    const res30 = resolveTimeRange({ preset: "30d" }, reference);
    expect(res30.preset).toBe("30d");
    expect(new Date(res30.fromIso).getTime()).toBe(new Date(reference).getTime() - 30 * 24 * 3600000);

    const resAll = resolveTimeRange({ preset: "all" }, reference);
    expect(resAll.preset).toBe("all");
    expect(resAll.shortLabel).toBe("Wszystko");
  });

  it("rozwiązuje własny zakres 'od - do' (custom)", () => {
    const customFrom = "2026-10-25T00:00:00.000Z";
    const customTo = "2026-10-28T23:59:59.000Z";
    const res = resolveTimeRange({ preset: "custom", from: customFrom, to: customTo }, reference);

    expect(res.preset).toBe("custom");
    expect(res.isCustom).toBe(true);
    expect(res.fromIso).toBe(customFrom);
    expect(res.toIso).toBe(customTo);
  });

  it("generuje poprawne parametry URL dla presetów i custom", () => {
    expect(buildTimeRangeParams({ preset: "24h" })).toBe("?time_range=24h");
    expect(buildTimeRangeParams({ preset: "8h" }, { channel: "official" })).toBe("?time_range=8h&channel=official");
    expect(buildTimeRangeParams({ from: "2026-10-01", to: "2026-10-15" })).toBe("?time_range=custom&from=2026-10-01&to=2026-10-15");
  });
});
