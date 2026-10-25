import { useEffect, useState } from "react";
const BASE = (import.meta as any).env?.VITE_API_URL || "http://localhost:8080";
export const EASE = "transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]";
export function useApi<T>(path: string | null) {
  const [s, set] = useState<{ data: T | null; error: string | null; loading: boolean }>({ data: null, error: null, loading: !!path });
  useEffect(() => {
    if (!path) return; let live = true;
    set(x => ({ ...x, loading: true, error: null }));
    fetch(BASE + path).then(async r => { if (!r.ok) throw new Error((await r.json().catch(() => ({}))).detail || `Request failed (${r.status})`); return r.json(); })
      .then(d => live && set({ data: d, error: null, loading: false }))
      .catch(e => live && set({ data: null, error: e.message || "Connection failed", loading: false }));
    return () => { live = false; };
  }, [path]);
  return s;
}
export const fmt = (n: number | null | undefined, d = 0) => n == null ? "n/a" : (Number(n.toFixed(d)) === 0 ? 0 : n).toLocaleString("en-GB", { maximumFractionDigits: d });
export const london = (iso: string, opts: Intl.DateTimeFormatOptions) => new Date(iso).toLocaleString("en-GB", { timeZone: "Europe/London", ...opts });
