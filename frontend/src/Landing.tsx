import { useEffect, useState, ReactNode } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform, useSpring, useMotionValue, useReducedMotion } from "framer-motion";
import { Wind, ArrowRight, ArrowUp, Plus, ClockCounterClockwise, ChartLineUp, ListMagnifyingGlass, BookOpen } from "@phosphor-icons/react";
import { EASE, useApi, fmt } from "./api"; import { Reveal, Word } from "./Reveal";

const LINKS = [["Benefits", "#benefits"], ["How it works", "#how"], ["Questions", "#faq"]];
const cta = `inline-flex items-center gap-2 rounded-full bg-white text-black px-3 py-2 text-base font-semibold hover:scale-105 active:scale-[0.98] ${EASE} focus-visible:ring-2 ring-emerald-400`;

export function Nav() {
  const [open, setOpen] = useState(false); const [active, setActive] = useState("");
  useEffect(() => {
    const io = new IntersectionObserver(es => es.forEach(e => e.isIntersecting && setActive("#" + e.target.id)), { rootMargin: "-40% 0px -55% 0px" });
    LINKS.forEach(([, h]) => { const el = document.querySelector(h); el && io.observe(el); });
    return () => io.disconnect();
  }, []);
  return <header className="fixed inset-x-0 top-0 z-50 flex flex-col items-center">
    <nav aria-label="Primary" className={`mt-6 mx-auto w-max rounded-full bg-[#181818]/80 backdrop-blur-3xl border border-[#313131] py-2 pl-4 pr-2 flex items-center gap-6 ${EASE}`}>
      <a href="#top" className="flex items-center gap-2 font-semibold text-base rounded-full focus-visible:ring-2 ring-white"><Wind size={20} weight="bold" className="text-emerald-400" />WindScope</a>
      <div className="hidden md:flex gap-4">{LINKS.map(([l, h]) => <a key={h} href={h} aria-current={active === h ? "location" : undefined} className={`text-sm font-semibold hover:text-white ${EASE} rounded focus-visible:ring-2 ring-white ${active === h ? "text-white" : "text-white/60"}`}>{l}</a>)}</div>
      <Link to="/app" className={`hidden md:inline-flex rounded-full bg-white text-black px-3 py-2 text-sm font-semibold hover:scale-105 active:scale-[0.98] ${EASE} focus-visible:ring-2 ring-emerald-400`}>Open app</Link>
      <button aria-label="Menu" aria-expanded={open} onClick={() => setOpen(!open)} className="md:hidden relative mr-2 size-6 rounded focus-visible:ring-2 ring-white">
        <span className={`absolute left-1 right-1 h-0.5 bg-white ${EASE} ${open ? "top-3 rotate-45" : "top-2"}`} /><span className={`absolute left-1 right-1 h-0.5 bg-white ${EASE} ${open ? "top-3 -rotate-45" : "top-4"}`} /></button>
    </nav>
    <div className={`fixed inset-0 -z-10 bg-black/80 backdrop-blur-3xl flex flex-col items-center justify-center gap-6 ${EASE} ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
      {[...LINKS, ["Open app", "/app"]].map(([l, h], i) => {
        const cls = `text-4xl font-semibold ${EASE} ${open ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0"}`, st = { transitionDelay: open ? `${100 + i * 50}ms` : "0ms" };
        return h.startsWith("/") ? <Link key={h} to={h} tabIndex={open ? 0 : -1} style={st} className={cls}>{l}</Link> : <a key={h} href={h} onClick={() => setOpen(false)} tabIndex={open ? 0 : -1} style={st} className={cls}>{l}</a>; })}
    </div></header>;
}

// Tower base sits at (x, y). Tower height h; blade length is half of h. Three blades spin around the hub.
function Turbine({ x, y, h, c, d = 12 }: { x: number; y: number; h: number; c: string; d?: number }) {
  const L = h * 0.5, w = h * 0.03;
  return <g transform={`translate(${x} ${y})`}>
    <path d={`M${-w * 1.1} 0L${-w * 0.4} ${-h}L${w * 0.4} ${-h}L${w * 1.1} 0Z`} fill={c} />
    <g transform={`translate(0 ${-h})`}><g className="blades" style={{ animationDuration: `${d}s` }}>
      {[0, 120, 240].map(a => <path key={a} transform={`rotate(${a})`} d={`M${-w * 0.7} 0L${-w * 0.3} ${-L}L${w * 0.3} ${-L}L${w * 0.7} 0Z`} fill={c} />)}
      <circle r={w * 1.1} fill={c} /></g></g></g>;
}
// Every layer is one 1600x900 scene, bottom anchored, never clipped (overflow-visible) and always behind the copy.
function Layer({ style, children }: { style: any; children: ReactNode }) {
  return <motion.div aria-hidden style={style} className="pointer-events-none absolute -inset-x-10 inset-y-0 z-0">
    <svg className="h-full w-full overflow-visible" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMax slice">{children}</svg></motion.div>;
}

export function Hero() {
  const reduce = useReducedMotion(); const k = reduce ? 0 : 1;
  const { scrollY } = useScroll();
  const yBack = useTransform(scrollY, [0, 900], [0, 30 * k]), yMid = useTransform(scrollY, [0, 900], [0, 80 * k]), yFront = useTransform(scrollY, [0, 900], [0, 160 * k]);
  const copyY = useTransform(scrollY, [0, 600], [0, -50 * k]), copyO = useTransform(scrollY, [0, 520], [1, reduce ? 1 : 0.15]);
  const px = useMotionValue(0), sx = useSpring(px, { stiffness: 60, damping: 20 });
  const xBack = useTransform(sx, v => v * -6 * k), xMid = useTransform(sx, v => v * -16 * k), xFront = useTransform(sx, v => v * -30 * k);
  const live = useApi<any>(`/api/analytics/summary`);
  return <section id="top" onPointerMove={e => px.set((e.clientX / window.innerWidth - 0.5) * 2)} className="relative min-h-screen overflow-hidden bg-black">
    <Layer style={{ y: yBack, x: xBack }}>
      <g className="max-md:hidden"><Turbine x={1010} y={730} h={150} c="#474747" d={18} /><Turbine x={1190} y={715} h={170} c="#474747" d={20} /><Turbine x={1390} y={705} h={160} c="#474747" d={17} /></g>
      <path d="M0 700Q400 640 800 690T1600 660V900H0Z" fill="#181818" /></Layer>
    <Layer style={{ y: yMid, x: xMid }}>
      <g className="max-md:hidden"><Turbine x={1090} y={800} h={260} c="#6E6E6E" d={14} /><Turbine x={1330} y={785} h={230} c="#6E6E6E" d={15} /></g>
      <path d="M0 770Q500 710 900 760T1600 730V900H0Z" fill="#1F1F1F" /></Layer>
    <Layer style={{ y: yFront, x: xFront }}>
      <g className="max-md:hidden"><Turbine x={1230} y={880} h={430} c="#4ADE80" d={11} /></g>
      <g className="md:hidden"><Turbine x={800} y={890} h={140} c="#4ADE80" d={11} /></g>
      <path d="M0 850Q500 815 1000 845T1600 825V900H0Z" fill="#131209" /></Layer>
    <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl items-center px-6 pt-24 pb-16">
      <motion.div style={{ y: copyY, opacity: copyO }}>
        <h1 className="max-w-[680px] text-5xl md:text-7xl font-semibold tracking-tight bg-clip-text text-transparent" style={{ backgroundImage: "linear-gradient(90deg,#FFFFFF,#9B9B9B)" }}>Know how wrong the wind forecast was before you buy</h1>
        <p className="mt-6 max-w-[680px] text-lg text-white/70">WindScope replays what Elexon had published at your day ahead cutoff for every half hour of January 2026, then scores it against what the turbines delivered.</p>
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <Link to="/app" className={cta}>Open the dashboard<ArrowRight size={16} weight="bold" /></Link>
          {live.data?.metrics?.n > 0 && <p className="font-mono text-sm text-white/60">Mean absolute error {fmt(live.data.metrics.mae)} MW across {fmt(live.data.metrics.n)} half hours</p>}</div>
      </motion.div></div>
  </section>;
}

const BENEFITS = [
  [ClockCounterClockwise, "See the forecast as it stood", "Pick a cutoff and watch which published versions count. Anything published after it is excluded.", "/app/replay", "Open the cutoff replay"],
  [ChartLineUp, "Know the typical miss", "Mean error, large miss error and bias in megawatts, with the forecast and actual lines side by side.", "/app", "Open the overview"],
  [ListMagnifyingGlass, "Find the worst half hours", "Daily error, the spread of misses and a sortable table of every matched half hour.", "/app/analysis", "Open the analysis"],
  [BookOpen, "Know what the numbers rest on", "Every field, rule and limit is written down, including what the tool cannot say about cost.", "/app/methodology", "Read the method"],
] as const;
export function Benefits() {
  return <section id="benefits" className="bg-black py-24"><div className="mx-auto max-w-6xl px-6">
    <Reveal><h2 className="max-w-[680px] text-4xl font-semibold">Four questions the buying desk can answer in minutes</h2></Reveal>
    <div className="mt-10 grid md:grid-cols-2 gap-6">{BENEFITS.map(([Icon, t, d, to, label], i) => <Reveal key={t} delay={i * 80}>
      <Link to={to} className={`group flex h-full flex-col rounded-2xl bg-[#181818] border border-[#272727] p-6 hover:bg-[#1F1F1F] ${EASE} focus-visible:ring-2 ring-emerald-400`}>
        <Icon size={28} weight="duotone" className="text-emerald-400" /><h3 className="mt-4 text-xl font-semibold">{t}</h3><p className="mt-2 text-base text-white/70">{d}</p>
        <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold">{label}<ArrowRight size={16} weight="bold" className={`${EASE} group-hover:translate-x-1`} /></span></Link></Reveal>)}</div></div></section>;
}

const TAG = "A forecast is only useful if you can see what it said at the moment you had to decide. We rebuild that moment for every half hour of the month.";
export function Tagline() {
  return <section className="bg-black py-24"><div className="mx-auto max-w-6xl px-6"><h2 className="max-w-[680px] text-4xl md:text-5xl font-semibold">{TAG.split(" ").map((w, i) => <Word key={i} w={w} />)}</h2></div></section>;
}

const STEPS = [["Pick a cutoff", "Choose when the buying decision is made. The default is 10:00 London time on the day before delivery."], ["Replay the forecast", "For each half hour we take the newest WINDFOR forecast published at or before that cutoff, and nothing later."], ["Score it", "We compare the selected forecast with FUELHH actual wind output and report error in megawatts, with the gaps counted."]];
export function HowItWorks() {
  return <section id="how" className="bg-black py-24"><div className="mx-auto max-w-6xl px-6">
    <Reveal><h2 className="max-w-[680px] text-4xl font-semibold">How the numbers are built</h2></Reveal>
    <div className="mt-10 grid md:grid-cols-3 gap-6">{STEPS.map(([t, d], i) => <Reveal key={t} delay={i * 100}><div className="h-full rounded-2xl bg-[#181818] border border-[#272727] p-6"><p className="font-mono text-sm text-emerald-400">Step {i + 1}</p><h3 className="mt-2 text-xl font-semibold">{t}</h3><p className="mt-3 text-base text-white/70">{d}</p></div></Reveal>)}</div>
    <Reveal><div className="mt-6 rounded-2xl bg-[#131209] border border-[#272727] p-6"><h3 className="text-xl font-semibold">What this does not tell you</h3>
      <p className="mt-3 max-w-[680px] text-base text-white/70">Only national wind output is analysed. There is no demand or price data here, so forecast error is not a financial loss. The cutoff times are analysis scenarios, not a verified procurement deadline.</p></div></Reveal></div></section>;
}

const FAQ = [
  ["Why does the cutoff time matter?", "Day ahead buying happens before delivery. A forecast published after you decided could not have informed the decision, so scoring it would flatter the forecast."],
  ["Which forecast does WindScope use?", "Elexon's WINDFOR dataset. For each half hour we take the most recent version published at or before your chosen cutoff."],
  ["What counts as actual wind generation?", "The FUELHH dataset filtered to wind, reported as average megawatts over each half hour."],
  ["What do MAE, RMSE and bias mean?", "MAE is the average size of the miss. RMSE gives large misses more weight. Bias is the average signed error: positive means the forecast ran above actual, negative means below."],
  ["Is forecast error the same as money lost?", "No. This tool has no demand or price data, so it measures forecast accuracy only and makes no cost estimate."],
  ["What happens when Elexon has no earlier version for a half hour?", "That half hour is left out of the scores and counted in coverage. Nothing is filled in or substituted with a later forecast."],
  ["Why only January 2026?", "The pilot is scoped to the purchase decisions made in January 2026."],
];
export function Faq() {
  return <section id="faq" className="bg-black py-24"><div className="mx-auto max-w-6xl px-6">
    <Reveal><h2 className="max-w-[680px] text-4xl font-semibold">Questions buyers ask first</h2></Reveal>
    <div className="mt-10 max-w-[680px] flex flex-col gap-3">{FAQ.map(([q, a], i) => <Reveal key={q} delay={i * 50}><details className="group rounded-2xl bg-[#181818] border border-[#272727] p-4 open:bg-[#1F1F1F]">
      <summary className={`flex cursor-pointer list-none items-center justify-between gap-4 rounded-lg text-base font-semibold ${EASE} focus-visible:ring-2 ring-emerald-400 [&::-webkit-details-marker]:hidden`}>{q}<Plus size={20} weight="bold" className={`shrink-0 ${EASE} group-open:rotate-45`} /></summary>
      <p className="mt-3 text-base text-white/70">{a}</p></details></Reveal>)}</div></div></section>;
}

export function FinalCta() {
  return <section className="bg-black py-24"><div className="mx-auto max-w-6xl px-6"><Reveal>
    <div className="rounded-2xl bg-[#131209] border border-[#272727] p-6 md:p-10">
      <h2 className="max-w-[680px] text-4xl md:text-5xl font-semibold">See what the forecast said when you had to decide</h2>
      <p className="mt-4 max-w-[680px] text-lg text-white/70">Every figure in the app comes from Elexon's published data for January 2026, with the gaps counted.</p>
      <Link to="/app" className={`mt-8 ${cta}`}>Open the dashboard<ArrowRight size={16} weight="bold" /></Link></div></Reveal></div></section>;
}

export function SiteFooter() {
  return <footer className="bg-black pb-16"><div className="mx-auto max-w-6xl px-6"><div className="border-t border-[#272727] pt-8 flex flex-wrap items-start justify-between gap-6">
    <div className="max-w-[680px] text-sm text-white/50"><p>Data: Elexon BMRS, FUELHH and WINDFOR datasets. Times shown in Europe/London.</p><p className="mt-2">Built with AI assistance (Claude). The selection and metric logic is covered by pytest.</p></div>
    <a href="#top" className={`inline-flex items-center gap-2 rounded-full border border-[#313131] px-3 py-2 text-sm font-semibold hover:bg-[#181818] active:scale-[0.98] ${EASE} focus-visible:ring-2 ring-white`}>Back to top<ArrowUp size={16} weight="bold" /></a></div></div></footer>;
}

export function LandingPage() {
  return <><a href="#benefits" className="sr-only focus:not-sr-only focus:fixed focus:z-[60] focus:bg-white focus:text-black focus:p-2">Skip to content</a>
    <Nav /><main><Hero /><Benefits /><Tagline /><HowItWorks /><Faq /><FinalCta /></main><SiteFooter /></>;
}

export function NotFound() {
  return <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-black px-6 text-center">
    <Wind size={40} weight="bold" className="text-emerald-400" /><h1 className="text-4xl font-semibold">Page not found</h1>
    <p className="max-w-[680px] text-lg text-white/70">That address does not exist in WindScope.</p>
    <Link to="/" className={cta}>Back to the home page</Link></main>;
}