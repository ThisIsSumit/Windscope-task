import { useEffect, useRef, useState } from "react";
import gsap from "gsap"; import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useApi, fmt, london, EASE } from "../api"; import { useFilters } from "./state"; import { panel, field, Skel } from "./ui";
gsap.registerPlugin(ScrollTrigger);

const TIMES = Array.from({ length: 48 }, (_, i) => `${String(Math.floor(i / 2)).padStart(2, "0")}:${i % 2 ? "30" : "00"}`);
const stamp = { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" } as const;

export default function Replay() {
  const root = useRef<HTMLElement>(null);
  const scrollTrigger = useRef<ScrollTrigger | null>(null);
  const { hour } = useFilters();
  const [day, setDay] = useState("2026-01-15"), [t, setT] = useState("10:00"), [pct, setPct] = useState(100);
  const h = useApi<{ publishTime: string; generation: number }[]>(`/api/forecast/history?start_time=${day}T${t}:00Z`);
  const revs = h.data || [];
  useEffect(() => {
    setPct(100);
    scrollTrigger.current?.kill();
    scrollTrigger.current = null;
    if (!revs.length || !root.current || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    scrollTrigger.current = ScrollTrigger.create({
      trigger: root.current,
      start: "top 80%",
      end: "bottom 20%",
      scrub: true,
      onUpdate: trigger => setPct(Math.round(trigger.progress * 100)),
    });
    return () => {
      scrollTrigger.current?.kill(false);
      scrollTrigger.current = null;
      ScrollTrigger.refresh();
    };
  }, [revs.length, day, t]);
  useEffect(() => {
    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener("resize", refresh);
    return () => window.removeEventListener("resize", refresh);
  }, []);
  const times = revs.map(r => new Date(r.publishTime).getTime());
  const lo = times.length ? Math.min(...times) : 0, hi = times.length ? Math.max(...times) + 3600e3 : 1, span = Math.max(hi - lo, 1);
  const cut = lo + (pct / 100) * span;
  const sel = [...revs].reverse().find(r => new Date(r.publishTime).getTime() <= cut);
  const max = Math.max(1, ...revs.map(r => r.generation));
  const setCutoff = (value: number) => {
    setPct(value);
    const trigger = scrollTrigger.current;
    if (trigger) {
      window.scrollTo({ top: trigger.start + (value / 100) * (trigger.end - trigger.start), behavior: "smooth" });
    }
  };
  return <section ref={root} className="min-h-screen">
    <p className="max-w-[680px] text-base text-white/70">Each bar is a forecast Elexon published for one half hour of delivery, placed at the time it appeared. Only bars left of the cutoff line could have informed the decision. The overview uses {String(hour).padStart(2, "0")}:00 on the day before.</p>
    <div className="mt-6 flex flex-wrap gap-4 text-sm">
      <label className="flex flex-col gap-1 text-white/60">Delivery day<input type="date" min="2026-01-01" max="2026-01-31" value={day} onChange={e => e.target.value && setDay(e.target.value)} className={field} /></label>
      <label className="flex flex-col gap-1 text-white/60">Half hour (London)<select value={t} onChange={e => setT(e.target.value)} className={field}>{TIMES.map(x => <option key={x}>{x}</option>)}</select></label></div>
    <div className={`mt-6 ${panel}`}>
      {h.loading ? <Skel h="h-64" /> : h.error ? <p role="alert" className="text-orange-300">{h.error}</p> : !revs.length ? <p className="py-8 text-center text-base text-white/60">Elexon returned no forecast revisions for this half hour, so revision history is unavailable. Nothing has been filled in.</p> : <>
        <div className="flex items-baseline justify-between gap-4 text-sm text-white/60"><span>Decision cutoff <span className="font-mono text-white">{london(new Date(cut).toISOString(), stamp)}</span></span><span className="font-mono">{fmt(max)} MW top of scale</span></div>
        <div className="relative mt-8 h-56 rounded-lg bg-[#131209]" role="img" aria-label={`Forecast revisions published before and after the cutoff for ${day} ${t}`}>
          {revs.map(r => { const ts = new Date(r.publishTime).getTime(), ok = ts <= cut, on = r === sel;
            return <div key={r.publishTime} style={{ left: `${((ts - lo) / span) * 100}%`, height: `${(r.generation / max) * 100}%` }} className={`absolute bottom-0 w-2 -translate-x-1/2 rounded-t ${EASE} ${on ? "bg-emerald-400" : ok ? "bg-blue-400/60" : "bg-[#313131]"}`} />; })}
          <div style={{ left: `${pct}%` }} className="absolute inset-y-0 w-px bg-white"><span className="absolute -top-6 -translate-x-1/2 whitespace-nowrap text-xs text-white/60">Cutoff</span></div></div>
        <label className="mt-4 block text-sm text-white/60">Scroll to move the cutoff, or select it manually<input type="range" min={0} max={100} step={0.5} value={pct} onChange={e => setCutoff(+e.target.value)} className="mt-2 w-full accent-emerald-400" aria-label="Decision cutoff" aria-valuetext={london(new Date(cut).toISOString(), stamp)} /></label>
        <p className="mt-4 text-base" aria-live="polite">{sel ? <>Selected forecast: <span className="font-mono text-2xl font-semibold">{fmt(sel.generation)} MW</span>, published {london(sel.publishTime, stamp)}.</> : "No forecast had been published by this cutoff."}</p>
        <p className="mt-2 text-xs text-white/50">Green is the forecast used. Blue was available but superseded. Grey was published after the cutoff and is excluded.</p></>}</div>
  </section>;
}
