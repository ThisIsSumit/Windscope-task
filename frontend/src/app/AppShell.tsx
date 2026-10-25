import { useEffect } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { SquaresFour, ListMagnifyingGlass, ClockCounterClockwise, Wind, ArrowLeft } from "@phosphor-icons/react";
import { EASE } from "../api"; import { FiltersProvider, useFilters } from "./state"; import { field } from "./ui";

const NAV = [["/app", "Overview", SquaresFour, true], ["/app/analysis", "Analysis", ListMagnifyingGlass, false], ["/app/replay", "Cutoff replay", ClockCounterClockwise, false]] as const;
const PAGES: Record<string, [string, string, boolean]> = {
  "/app": ["Overview", "How the selected forecast compared with actual wind output.", true],
  "/app/analysis": ["Forecast analysis", "Where and how the forecast missed, half hour by half hour.", true],
  "/app/replay": ["Cutoff replay", "See which published forecast versions were available at a given cutoff.", false],
};

function FilterBar() {
  const { start, end, hour, setStart, setEnd, setHour, sum } = useFilters(); const f = sum.data?.freshness?.forecasts;
  return <div className="mt-6 flex flex-wrap items-end gap-4 text-sm">
    {[["From", start, setStart], ["To", end, setEnd]].map(([l, v, fn]: any) => <label key={l} className="flex flex-col gap-1 text-white/60">{l}<input type="date" min="2026-01-01" max="2026-01-31" value={v} onChange={e => e.target.value && fn(e.target.value)} className={field} /></label>)}
    <label className="flex flex-col gap-1 text-white/60">Decision cutoff (day before, London)<select value={hour} onChange={e => setHour(+e.target.value)} className={field}>{[8, 9, 10, 11, 12, 13, 14].map(h => <option key={h} value={h}>{String(h).padStart(2, "0")}:00</option>)}</select></label>
    {f && <p className="pb-2 text-white/50" aria-live="polite">{f.stale ? "Showing cached data, Elexon unreachable" : f.cached ? "Cached, under 10 minutes old" : "Fetched live from Elexon"}</p>}</div>;
}

function Shell() {
  const { pathname } = useLocation(); const [title, sub, filters] = PAGES[pathname.replace(/\/$/, "") || "/app"] || PAGES["/app"];
  const { sum } = useFilters();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  const item = (a: boolean) => `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold ${EASE} focus-visible:ring-2 ring-emerald-400 ${a ? "bg-[#272727] text-white" : "text-white/60 hover:bg-[#1F1F1F] hover:text-white"}`;
  return <div className="min-h-screen bg-black text-white md:pl-60">
    <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:z-[60] focus:bg-white focus:text-black focus:p-2">Skip to content</a>
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col bg-[#131209] p-4 md:flex">
      <Link to="/" className="flex items-center gap-2 rounded-lg px-3 py-2 text-base font-semibold focus-visible:ring-2 ring-emerald-400"><Wind size={20} weight="bold" className="text-emerald-400" />WindScope</Link>
      <nav aria-label="App" className="mt-6 flex flex-col gap-1">{NAV.map(([to, label, Icon, end]) => <NavLink key={to} to={to} end={end} className={({ isActive }) => item(isActive)}><Icon size={20} weight="duotone" />{label}</NavLink>)}</nav>
      <div className="mt-auto flex flex-col gap-3 text-xs text-white/50">
        
        <Link to="/" className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-white/60 hover:bg-[#1F1F1F] hover:text-white ${EASE} focus-visible:ring-2 ring-emerald-400`}><ArrowLeft size={16} weight="bold" />Back to site</Link></div></aside>
    <nav aria-label="App" className="fixed inset-x-0 bottom-0 z-40 flex justify-around bg-[#181818] p-2 md:hidden">{NAV.map(([to, label, Icon, end]) => <NavLink key={to} to={to} end={end} className={({ isActive }) => `flex flex-1 flex-col items-center gap-1 rounded-lg py-2 text-xs font-semibold focus-visible:ring-2 ring-emerald-400 ${isActive ? "bg-[#272727] text-white" : "text-white/60"}`}><Icon size={20} weight="duotone" />{label.replace("Cutoff replay", "Replay")}</NavLink>)}</nav>
    <div className="mx-auto max-w-6xl px-6 pt-8 pb-28 md:pb-12">
      <header><Link to="/" className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-white/60 md:hidden"><Wind size={16} weight="bold" className="text-emerald-400" />WindScope</Link>
        <h1 className="text-3xl font-semibold">{title}</h1><p className="mt-1 text-base text-white/60">{sub}</p>
        {filters && <>{<FilterBar />}{sum.data?.scenario && <p className="mt-3 text-xs text-white/50">Scenario: {sum.data.scenario}</p>}</>}</header>
      <main id="main" className="mt-8"><Outlet /></main></div></div>;
}
export default function AppShell() { return <FiltersProvider><Shell /></FiltersProvider>; }
