import time
import pandas as pd
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from . import elexon
from .metrics import add_errors, summarize
from .selection import select_all

app = FastAPI(title="WindScope API", version="0.1")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["GET"], allow_headers=["*"])
_cache: dict = {}  # key -> (timestamp, payload)
TTL = 600

def _cached(key, fn):
    hit = _cache.get(key)
    if hit and time.time() - hit[0] < TTL:
        return hit[1], {"cached": True, "stale": False, "fetched_at": hit[0]}
    try:
        val = fn(); _cache[key] = (time.time(), val)
        return val, {"cached": False, "stale": False, "fetched_at": time.time()}
    except elexon.ElexonError as e:
        if hit: return hit[1], {"cached": True, "stale": True, "fetched_at": hit[0], "warning": str(e)}
        raise HTTPException(502, f"Elexon unavailable and no cached data: {e}")

def build(start: str, end: str, hour: int, minute: int):
    actual, m1 = _cached(("a", start, end), lambda: elexon.fetch_actuals(start, end))
    fc_all, m2 = _cached(("f", start, end), lambda: elexon.fetch_forecast_history(start, end))
    sel = select_all(fc_all, hour, minute) if len(fc_all) else pd.DataFrame(columns=["startTime", "publishTime", "cutoff", "forecast"])
    lo, hi = pd.Timestamp(start, tz="UTC"), pd.Timestamp(end, tz="UTC") + pd.Timedelta(days=1)
    actual = actual[(actual.startTime >= lo) & (actual.startTime < hi)]
    sel = sel[(sel.startTime >= lo) & (sel.startTime < hi)]
    merged = actual.merge(sel, on="startTime", how="outer")
    cov = {"expected_intervals": int((hi - lo) / pd.Timedelta(minutes=30)),
           "actual": int(merged.actual.notna().sum()), "forecast": int(merged.forecast.notna().sum()),
           "matched": int((merged.actual.notna() & merged.forecast.notna()).sum()),
           "forecast_versions_total": int(len(fc_all)),
           "forecast_versions_per_interval_max": int(fc_all.groupby("startTime").size().max()) if len(fc_all) else 0}
    cov["missing_forecast"] = cov["actual"] - cov["matched"]
    return merged, cov, {"actuals": m1, "forecasts": m2}

def _validate(start, end):
    if not ("2026-01-01" <= start <= end <= "2026-01-31"):
        raise HTTPException(422, "Range must lie within 2026-01-01..2026-01-31 and start <= end")

@app.get("/api/health")
def health(): return {"status": "ok"}

@app.get("/api/analytics/summary")
def summary(start: str = "2026-01-01", end: str = "2026-01-31", cutoff_hour: int = Query(10, ge=0, le=23), cutoff_minute: int = Query(0, ge=0, le=59)):
    _validate(start, end)
    m, cov, meta = build(start, end, cutoff_hour, cutoff_minute)
    return {"scenario": f"Previous day {cutoff_hour:02d}:{cutoff_minute:02d} Europe/London (configurable scenario, not an official deadline)",
            "metrics": summarize(m.dropna(subset=["actual", "forecast"])), "coverage": cov, "freshness": meta,
            "limitation": None if cov["forecast_versions_per_interval_max"] > 1 else
            "API returned <=1 forecast version per interval: historical decision-time reconstruction is NOT verified."}

@app.get("/api/analytics/errors")
def errors(start: str = "2026-01-01", end: str = "2026-01-31", cutoff_hour: int = Query(10, ge=0, le=23), cutoff_minute: int = Query(0, ge=0, le=59)):
    _validate(start, end)
    m, _, _ = build(start, end, cutoff_hour, cutoff_minute)
    d = add_errors(m.dropna(subset=["actual", "forecast"])).sort_values("startTime")
    return d.assign(startTime=d.startTime.dt.strftime("%Y-%m-%dT%H:%M:%SZ"), publishTime=d.publishTime.dt.strftime("%Y-%m-%dT%H:%M:%SZ"),
                    cutoff=d.cutoff.dt.strftime("%Y-%m-%dT%H:%M:%SZ")).astype(object).where(d.notna(), None).to_dict("records")

@app.get("/api/forecast/history")
def history(start_time: str):
    t = pd.Timestamp(start_time)
    t = t.tz_localize("UTC") if t.tzinfo is None else t.tz_convert("UTC")
    day = t.strftime("%Y-%m-%d"); _validate(day, day)
    fc, _ = _cached(("f", day, day), lambda: elexon.fetch_forecast_history(day, day))
    h = fc[fc.startTime == t].sort_values("publishTime") if len(fc) else fc
    return [{"publishTime": r.publishTime.isoformat(), "generation": r.generation} for r in h.itertuples()]
