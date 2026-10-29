"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      // 1. Natychmiastowe zablokowanie widoku w kliencie
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("ttscope:lock"));
      }
      // 2. Unieważnienie sesji na serwerze
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      title="Zablokuj konsolę i wyloguj sesję"
      className="flex items-center gap-1.5 px-3 py-2 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/40 rounded-xl text-xs font-semibold text-rose-300 hover:text-white transition-all shadow-[0_0_15px_rgba(244,63,94,0.15)] disabled:opacity-50 flex-shrink-0"
    >
      <LogOut className="w-3.5 h-3.5" />
      <span>{loading ? "..." : "Zablokuj"}</span>
    </button>
  );
}
