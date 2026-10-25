import { createContext, useContext, useMemo, useState, ReactNode } from "react";
import { useApi, london } from "../api";
type Q<T> = { data: T | null; error: string | null; loading: boolean };
type Ctx = { start: string; end: string; hour: number; setStart: (v: string) => void; setEnd: (v: string) => void; setHour: (v: number) => void; sum: Q<any>; err: Q<any[]>; rows: any[] };
const C = createContext<Ctx>(null as any);
export const useFilters = () => useContext(C);
export function FiltersProvider({ children }: { children: ReactNode }) {
  const [start, setStart] = useState("2026-01-01"), [end, setEnd] = useState("2026-01-31"), [hour, setHour] = useState(10);
  const q = `start=${start <= end ? start : end}&end=${end}&cutoff_hour=${hour}`;
  const sum = useApi<any>(`/api/analytics/summary?${q}`), err = useApi<any[]>(`/api/analytics/errors?${q}`);
  const rows = useMemo(() => (err.data || []).map(r => ({ ...r, ts: london(r.startTime, { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }),
    pub: london(r.publishTime, { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }), over: Math.max(r.error, 0), under: Math.min(r.error, 0) })), [err.data]);
  return <C.Provider value={{ start, end, hour, setStart, setEnd, setHour, sum, err, rows }}>{children}</C.Provider>;
}
