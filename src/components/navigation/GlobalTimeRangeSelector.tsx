"use client";

import { useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Clock, Calendar, Check, ChevronDown } from "lucide-react";
import {
  TIME_RANGE_PRESETS,
  type TimeRangePreset,
} from "@/lib/analytics/time-ranges";

interface GlobalTimeRangeSelectorProps {
  currentPreset?: TimeRangePreset;
  currentFrom?: string;
  currentTo?: string;
}

export function GlobalTimeRangeSelector({
  currentPreset = "24h",
  currentFrom,
  currentTo,
}: GlobalTimeRangeSelectorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customFromDate, setCustomFromDate] = useState(
    currentFrom ? currentFrom.slice(0, 16) : ""
  );
  const [customToDate, setCustomToDate] = useState(
    currentTo ? currentTo.slice(0, 16) : ""
  );

  const applyPreset = (preset: TimeRangePreset) => {
    if (preset === "custom") {
      setShowCustomModal(true);
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    params.set("time_range", preset);
    params.delete("from");
    params.delete("to");

    router.push(`${pathname}?${params.toString()}`);
  };

  const applyCustomRange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customFromDate) return;

    const fromIso = new Date(customFromDate).toISOString();
    const toIso = customToDate
      ? new Date(customToDate).toISOString()
      : new Date().toISOString();

    const params = new URLSearchParams(searchParams.toString());
    params.set("time_range", "custom");
    params.set("from", fromIso);
    params.set("to", toIso);

    setShowCustomModal(false);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-1.5 bg-[#051124]/90 p-1 rounded-xl border border-cyan-500/30 shadow-[0_2px_15px_rgba(0,0,0,0.4)] flex-wrap">
      <div className="flex items-center gap-1.5 px-2.5 py-1 text-slate-400 font-mono text-[11px] uppercase tracking-wider border-r border-white/10 hidden sm:flex">
        <Clock className="w-3.5 h-3.5 text-cyan-400" />
        <span>Horyzont:</span>
      </div>

      <div className="flex items-center gap-1 flex-wrap">
        {TIME_RANGE_PRESETS.map((p) => {
          const isActive = currentPreset === p.preset;
          return (
            <button
              key={p.preset}
              onClick={() => applyPreset(p.preset)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                isActive
                  ? "bg-gradient-to-r from-cyan-400 to-sky-500 text-slate-950 shadow-[0_0_15px_rgba(0,229,255,0.35)]"
                  : "text-slate-300 hover:text-white hover:bg-white/5"
              }`}
            >
              {isActive && <Check className="w-3 h-3 stroke-[3]" />}
              <span>{p.shortLabel}</span>
            </button>
          );
        })}
      </div>

      {/* Modal definiowania własnego zakresu "od - do" */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#07162c] border border-cyan-500/40 rounded-2xl p-6 max-w-md w-full shadow-[0_20px_50px_rgba(0,0,0,0.8)] space-y-4">
            <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-cyan-400" />
                <h4 className="text-sm font-bold text-white uppercase tracking-wide font-mono">
                  Własny zakres analizy (Od - Do)
                </h4>
              </div>
              <button
                onClick={() => setShowCustomModal(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                Zamknij
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Wybierz dokładny przedział czasu publikacji. Wszystkie wskaźniki, wykresy i publikacje zostaną przeliczone dla tego okna.
            </p>

            <form onSubmit={applyCustomRange} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-medium block">Data i godzina początkowa (Od):</label>
                <input
                  type="datetime-local"
                  required
                  value={customFromDate}
                  onChange={(e) => setCustomFromDate(e.target.value)}
                  className="w-full bg-[#030914] border border-cyan-500/30 rounded-lg p-2.5 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-medium block">Data i godzina końcowa (Do):</label>
                <input
                  type="datetime-local"
                  value={customToDate}
                  onChange={(e) => setCustomToDate(e.target.value)}
                  className="w-full bg-[#030914] border border-cyan-500/30 rounded-lg p-2.5 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-cyan-500/15">
                <button
                  type="button"
                  onClick={() => setShowCustomModal(false)}
                  className="px-3 py-2 rounded-lg bg-surface-muted hover:bg-surface text-slate-300 text-xs"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-400 to-sky-500 text-slate-950 font-bold text-xs shadow-md hover:from-cyan-300 hover:to-sky-400"
                >
                  Zastosuj zakres
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
