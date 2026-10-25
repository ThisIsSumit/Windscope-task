import { useRef, ReactNode } from "react";
import { useInView, useReducedMotion } from "framer-motion";
import { Warning } from "@phosphor-icons/react";
import { fmt, EASE } from "../api"; import { useFilters } from "./state";

export const tip = { contentStyle: { background: "#181818", border: "1px solid #313131", borderRadius: 8, fontSize: 14 }, labelStyle: { color: "#9B9B9B" } };
export const axis = { stroke: "#9B9B9B", fontSize: 12, tickLine: false } as any;
export const card = "rounded-2xl bg-[#181818] border border-[#272727] p-4";
export const panel = "rounded-2xl bg-[#181818] border border-[#272727] p-6";
export const field = "rounded-lg bg-[#181818] border border-[#313131] px-3 py-2 text-base text-white focus-visible:ring-2 ring-emerald-400";
export const Skel = ({ h }: { h: string }) => <div className={`skeleton rounded-2xl ${h}`} />;
export function useAnim() { const r = useReducedMotion(); return { isAnimationActive: !r, animationDuration: 1100, animationEasing: "ease-out" as const }; }

export function KPI({ label, value, unit, hint }: { label: string; value: string; unit?: string; hint: string }) {
  return <div className={`${card} hover:bg-[#1F1F1F] ${EASE}`}><p className="text-sm text-white/60">{label}</p>
    <p className="mt-2 font-mono text-3xl font-semibold">{value}<span className="ml-1 text-sm text-white/50">{unit}</span></p><p className="mt-2 text-xs text-white/50">{hint}</p></div>;
}
export function InView({ h, children }: { h: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null); const on = useInView(ref, { once: true, margin: "-10% 0px" });
  return <div ref={ref} className={h}>{on ? children : <Skel h="h-full" />}</div>;
}
export function Notices() {
  const { sum } = useFilters();
  return <>{sum.error && <p role="alert" className="mb-6 flex gap-2 rounded-2xl bg-[#131209] border border-orange-400/50 p-4 text-orange-300"><Warning size={20} weight="bold" className="shrink-0" />{sum.error}. Check that the backend is running and Elexon is reachable.</p>}
    {sum.data?.limitation && <p role="status" className="mb-6 flex gap-2 rounded-2xl bg-[#131209] border border-orange-400/50 p-4 text-orange-300"><Warning size={20} weight="bold" className="shrink-0" />{sum.data.limitation}</p>}</>;
}
export function Empty({ children }: { children: ReactNode }) { return <p className="py-16 text-center text-base text-white/60">{children}</p>; }

export function Insights({ m, c }: { m: any; c: any }) {
  if (!m || !m.n) return null;
  const rel = m.mean_actual ? (Math.abs(m.bias) / m.mean_actual) * 100 : 0, maeRel = m.mean_actual ? (m.mae / m.mean_actual) * 100 : null;
  const dir = rel < 2 ? "flat" : m.bias > 0 ? "high" : "low";
  const observed = `Across ${fmt(m.n)} matched half hours the selected forecast averaged ${fmt(m.mean_forecast)} MW against ${fmt(m.mean_actual)} MW actual. Mean absolute error was ${fmt(m.mae)} MW${maeRel == null ? "" : `, about ${fmt(maeRel, 1)}% of mean actual output`}.`;
  const interp = dir === "flat" ? `Over and under forecasts roughly offset (bias ${fmt(m.bias)} MW), so the average hides the size of individual misses.`
    : dir === "high" ? `The forecast ran high by ${fmt(Math.abs(m.bias))} MW on average: it tended to promise more wind than arrived.` : `The forecast ran low by ${fmt(Math.abs(m.bias))} MW on average: more wind arrived than it promised.`;
  const impl = dir === "flat" ? "A near zero average does not mean small misses. Read MAE and RMSE for the typical and the large miss." : dir === "high" ? "When wind cover is over assumed at the cutoff, more of the volume has to be sourced elsewhere than the forecast suggested. Treat the average error as a margin to weigh, not a quantity to buy." : "When wind cover is under assumed at the cutoff, a position built on the forecast can end up longer than needed. Treat the average error as a margin to weigh, not a quantity to buy.";
  const partial = c && c.matched < c.expected_intervals ? ` Coverage is ${fmt(c.matched)} of ${fmt(c.expected_intervals)} half hours, so these figures are partial.` : "";
  return <div className="mt-6 grid md:grid-cols-3 gap-4">{[["Observed", observed + partial], ["What it suggests", interp], ["For procurement", impl + " No demand or price data is used, so this is not a cost estimate."]].map(([t, d]) =>
    <div key={t} className={card}><h3 className="text-sm font-semibold text-emerald-400">{t}</h3><p className="mt-2 text-base text-white/70">{d}</p></div>)}</div>;
}

export function TopMisses({ rows }: { rows: any[] }) {
  const top = [...rows].sort((a, b) => b.abs_error - a.abs_error).slice(0, 5);
  if (!top.length) return null;
  return <div className={`mt-6 ${panel}`}><h3 className="text-xl font-semibold">Five largest misses</h3>
    <div className="mt-4 overflow-x-auto"><table className="w-full text-left text-sm"><caption className="sr-only">Half hours with the largest absolute forecast error</caption>
      <thead className="text-white/60"><tr><th className="py-2 pr-4 font-semibold">Half hour (London)</th><th className="py-2 pr-4 text-right font-semibold">Forecast MW</th><th className="py-2 pr-4 text-right font-semibold">Actual MW</th><th className="py-2 text-right font-semibold">Error MW</th></tr></thead>
      <tbody className="font-mono">{top.map(r => <tr key={r.startTime} className="border-t border-[#272727]"><td className="py-2 pr-4">{r.ts}</td><td className="py-2 pr-4 text-right">{fmt(r.forecast)}</td><td className="py-2 pr-4 text-right">{fmt(r.actual)}</td>
        <td className={`py-2 text-right ${r.error > 0 ? "text-orange-300" : "text-red-300"}`}>{r.error > 0 ? "+" : ""}{fmt(r.error)} {r.error > 0 ? "over" : "under"}</td></tr>)}</tbody></table></div></div>;
}
