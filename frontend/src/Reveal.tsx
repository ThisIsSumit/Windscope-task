import { useEffect, useRef, useState, ReactNode } from "react";
import { EASE } from "./api";
export function Reveal({ children, delay = 0, className = "" }: { children: ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null); const [on, setOn] = useState(false);
  useEffect(() => { const io = new IntersectionObserver(([e]) => e.isIntersecting && (setOn(true), io.disconnect()), { threshold: 0.12 }); ref.current && io.observe(ref.current); return () => io.disconnect(); }, []);
  return <div ref={ref} style={{ transitionDelay: `${delay}ms` }} className={`${EASE} motion-reduce:transition-none ${on ? "translate-y-0 blur-0 opacity-100" : "translate-y-16 blur-md opacity-0 motion-reduce:translate-y-0 motion-reduce:blur-0 motion-reduce:opacity-100"} ${className}`}>{children}</div>;
}
export function Word({ w }: { w: string }) {
  const ref = useRef<HTMLSpanElement>(null); const [on, setOn] = useState(false);
  useEffect(() => { const io = new IntersectionObserver(([e]) => setOn(e.isIntersecting || e.boundingClientRect.top < 0), { rootMargin: "-55% 0px -45% 0px" }); ref.current && io.observe(ref.current); return () => io.disconnect(); }, []);
  return <span ref={ref} className={`${EASE} ${on ? "text-white" : "text-white/30"}`}>{w} </span>;
}
