import { useMemo, useState } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from "recharts";
import { CaretUp, CaretDown, DownloadSimple } from "@phosphor-icons/react";
import { fmt, london, EASE } from "../api"; import { useFilters } from "./state";
import { Skel, InView, Notices, Empty, panel, tip, axis, useAnim, field } from "./ui";

type Key = "startTime" | "forecast" | "actual" | "error" | "abs_error" | "pct_error";
const COLS: [Key, string][] = [["startTime", "Half hour (London)"], ["forecast", "Forecast MW"], ["actual", "Actual MW"], ["error", "Error MW"], ["abs_error", "Absolute MW"], ["pct_error", "Error %"]];

export default function Analysis() {
  const { err, rows } = useFilters(); const anim = useAnim();
  const [key, setKey] = useState<Key>("abs_error"), [dir, setDir] = useState<1 | -1>(-1), [page, setPage] = useState(0), [side, setSide] = useState("all");
  const daily = useMemo(() => {
    const g: Record<string, { n: number; abs: number; sq: number; sum: number }> = {};
    rows.forEach(r => { const d = london(r.startTime, { year: "numeric", month: "2-digit", day: "2-digit" }).split("/").reverse().join("-"); const x = g[d] ||= { n: 0, abs: 0, sq: 0, sum: 0 }; x.n++; x.abs += r.abs_error; x.sq += r.error ** 2; x.sum += r.error; });
    return Object.entries(g).sort().map(([d, x]) => ({ d: d.slice(5).replace("-", "/"), n: x.n, mae: x.abs / x.n, rmse: Math.sqrt(x.sq / x.n), bias: x.sum / x.n }));
  }, [rows]);
  const hist = useMemo(() => {
    if (!rows.length) return [];
    const lim = Math.max(...rows.map(r => Math.abs(r.error))), step = Math.max(Math.ceil(lim / 10 / 100) * 100, 100), b: Record<number, number> = {};
    rows.forEach(r => { const i = Math.floor(r.error / step); b[i] = (b[i] || 0) + 1; });
    const ks = Object.keys(b).map(Number), lo = Math.min(...ks), hi = Math.max(...ks);
    return Array.from({ length: hi - lo + 1 }, (_, j) => ({ label: `${(lo + j) * step}`, n: b[lo + j] || 0, neg: (lo + j) < 0 }));
  }, [rows]);
  const view = useMemo(() => { const f = rows.filter(r => side === "all" || (side === "over" ? r.error > 0 : r.error < 0));
    return [...f].sort((a, b) => ((a[key] ?? -Infinity) > (b[key] ?? -Infinity) ? 1 : -1) * dir); }, [rows, key, dir, side]);
  const PAGE = 25, pages = Math.max(Math.ceil(view.length / PAGE), 1), slice = view.slice(page * PAGE, page * PAGE + PAGE);
  const sort = (k: Key) => { if (k === key) setDir(d => (d === 1 ? -1 : 1)); else { setKey(k); setDir(-1); } setPage(0); };
  const csv = () => { const h = "startTime,publishTime,forecast,actual,error,abs_error,pct_error\n", b = view.map(r => [r.startTime, r.publishTime, r.forecast, r.actual, r.error, r.abs_error, r.pct_error ?? ""].join(",")).join("\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([h + b], { type: "text/csv" })); a.download = "windscope-intervals.csv"; a.click(); URL.revokeObjectURL(a.href); };

  return <>
    <Notices />
    {err.loading ? <Skel h="h-80" /> : !rows.length ? <div className={panel}><Empty>No matched intervals for this range and cutoff. Try a wider range.</Empty></div> : <>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className={panel}><h2 className="text-xl font-semibold">Daily MAE and RMSE, MW</h2><p className="mt-1 text-sm text-white/60">Each day's average miss and large miss error.</p>
          <InView h="mt-4 h-64"><ResponsiveContainer><BarChart data={daily}><CartesianGrid stroke="#272727" /><XAxis dataKey="d" {...axis} /><YAxis {...axis} width={48} /><Tooltip {...tip} formatter={(v: number) => `${fmt(v)} MW`} />
            <Bar name="MAE" dataKey="mae" fill="#60A5FA" {...anim} /><Bar name="RMSE" dataKey="rmse" fill="#FB923C" {...anim} /></BarChart></ResponsiveContainer></InView></div>
        <div className={panel}><h2 className="text-xl font-semibold">Daily bias, MW</h2><p className="mt-1 text-sm text-white/60">Above zero the forecast ran high that day, below zero it ran low.</p>
          <InView h="mt-4 h-64"><ResponsiveContainer><BarChart data={daily}><CartesianGrid stroke="#272727" /><XAxis dataKey="d" {...axis} /><YAxis {...axis} width={48} /><Tooltip {...tip} formatter={(v: number) => `${fmt(v)} MW`} /><ReferenceLine y={0} stroke="#9B9B9B" />
            <Bar name="Bias" dataKey="bias" fill="#4ADE80" {...anim} /></BarChart></ResponsiveContainer></InView></div></div>
      <div className={`mt-6 ${panel}`}><h2 className="text-xl font-semibold">Spread of errors</h2><p className="mt-1 text-sm text-white/60">Number of half hours by error size. Each bar starts at the MW value on its label.</p>
        <InView h="mt-4 h-64"><ResponsiveContainer><BarChart data={hist}><CartesianGrid stroke="#272727" /><XAxis dataKey="label" {...axis} /><YAxis {...axis} width={48} allowDecimals={false} /><Tooltip {...tip} formatter={(v: number) => `${v} half hours`} />
          <Bar name="Half hours" dataKey="n" fill="#FB923C" {...anim} /></BarChart></ResponsiveContainer></InView></div>
      <div className={`mt-6 ${panel}`}>
        <div className="flex flex-wrap items-end justify-between gap-4"><div><h2 className="text-xl font-semibold">All matched half hours</h2><p className="mt-1 text-sm text-white/60">{fmt(view.length)} rows. Select a column heading to sort.</p></div>
          <div className="flex items-end gap-3"><label className="flex flex-col gap-1 text-sm text-white/60">Show<select value={side} onChange={e => { setSide(e.target.value); setPage(0); }} className={field}><option value="all">All errors</option><option value="over">Over forecast only</option><option value="under">Under forecast only</option></select></label>
            <button onClick={csv} className={`inline-flex items-center gap-2 rounded-lg border border-[#313131] px-3 py-2 text-sm font-semibold hover:bg-[#1F1F1F] active:scale-[0.98] ${EASE} focus-visible:ring-2 ring-emerald-400`}><DownloadSimple size={16} weight="bold" />Download CSV</button></div></div>
        <div className="mt-4 overflow-x-auto"><table className="w-full text-left text-sm"><caption className="sr-only">Matched half hours with forecast, actual and error</caption>
          <thead><tr>{COLS.map(([k, l]) => <th key={k} scope="col" aria-sort={k === key ? (dir === 1 ? "ascending" : "descending") : "none"} className="py-2 pr-4 font-semibold text-white/60 last:pr-0">
            <button onClick={() => sort(k)} className={`inline-flex items-center gap-1 rounded hover:text-white focus-visible:ring-2 ring-emerald-400 ${k !== "startTime" ? "ml-auto" : ""}`}>{l}{k === key && (dir === 1 ? <CaretUp size={12} weight="bold" /> : <CaretDown size={12} weight="bold" />)}</button></th>)}</tr></thead>
          <tbody className="font-mono">{slice.map(r => <tr key={r.startTime} className="border-t border-[#272727]"><td className="py-2 pr-4">{r.ts}</td><td className="py-2 pr-4 text-right">{fmt(r.forecast)}</td><td className="py-2 pr-4 text-right">{fmt(r.actual)}</td>
            <td className={`py-2 pr-4 text-right ${r.error > 0 ? "text-orange-300" : "text-red-300"}`}>{r.error > 0 ? "+" : ""}{fmt(r.error)}</td><td className="py-2 pr-4 text-right">{fmt(r.abs_error)}</td><td className="py-2 text-right">{r.pct_error == null ? "n/a" : fmt(r.pct_error, 1)}</td></tr>)}</tbody></table></div>
        <div className="mt-4 flex items-center justify-between text-sm text-white/60"><span>Page {page + 1} of {pages}</span><div className="flex gap-2">
          {[["Previous", -1, page === 0], ["Next", 1, page >= pages - 1]].map(([l, d, off]: any) => <button key={l} disabled={off} onClick={() => setPage(p => p + d)} className={`rounded-lg border border-[#313131] px-3 py-2 font-semibold hover:bg-[#1F1F1F] disabled:opacity-40 disabled:hover:bg-transparent active:scale-[0.98] ${EASE} focus-visible:ring-2 ring-emerald-400`}>{l}</button>)}</div></div></div></>}
  </>;
}
