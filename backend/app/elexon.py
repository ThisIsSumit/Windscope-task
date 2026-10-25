import httpx, time, pandas as pd

BASE = "https://data.elexon.co.uk/bmrs/api/v1/datasets"

class ElexonError(Exception): ...

def _get(path: str, params: dict, retries: int = 3) -> list[dict]:
    params = {**params, "format": "json"}
    for i in range(retries):
        try:
            r = httpx.get(f"{BASE}/{path}", params=params, timeout=30)
            if r.status_code in (429, 500, 502, 503):
                time.sleep(2 ** i); continue
            if r.status_code == 400:
                raise ElexonError(f"400 bad params: {r.text[:200]}")
            r.raise_for_status()
            data = r.json()
            return data if isinstance(data, list) else data.get("data", [])
        except (httpx.TransportError, ValueError) as e:
            if i == retries - 1: raise ElexonError(str(e))
            time.sleep(2 ** i)
    raise ElexonError(f"gave up after {retries} tries: {path}")

def _clean(rows, cols):
    df = pd.DataFrame(rows)
    if df.empty: return pd.DataFrame(columns=cols)
    for c in ("startTime", "publishTime"):
        if c in df: df[c] = pd.to_datetime(df[c], utc=True, errors="coerce")
    df["generation"] = pd.to_numeric(df["generation"], errors="coerce")
    return df.dropna(subset=["startTime", "generation"]).drop_duplicates()

def fetch_actuals(start: str, end: str) -> pd.DataFrame:
    # settlement-date params; cannot be combined with publishDateTime* params
    rows = _get("FUELHH/stream", {"settlementDateFrom": start, "settlementDateTo": end, "fuelType": "WIND"})
    df = _clean(rows, ["startTime", "generation"])
    if "fuelType" in df: df = df[df["fuelType"] == "WIND"]
    if "publishTime" in df: df = df.sort_values("publishTime")
    return df.drop_duplicates("startTime", keep="last")[["startTime", "generation"]].rename(columns={"generation": "actual"})

def fetch_forecast_history(start: str, end: str, lookback_days: int = 7) -> pd.DataFrame:
    """ALL forecast versions published in [start - lookback, end+1d], in 1-day publish windows.
    Filters are on publishTime, NOT target startTime."""
    t0 = pd.Timestamp(start, tz="UTC") - pd.Timedelta(days=lookback_days)
    t1 = pd.Timestamp(end, tz="UTC") + pd.Timedelta(days=1)
    frames = []
    for d in pd.date_range(t0, t1, freq="1D", inclusive="left"):
        rows = _get("WINDFOR/stream", {"publishDateTimeFrom": d.strftime("%Y-%m-%dT%H:%M:%SZ"),
                                       "publishDateTimeTo": (d + pd.Timedelta(days=1)).strftime("%Y-%m-%dT%H:%M:%SZ")})
        frames.append(_clean(rows, ["startTime", "publishTime", "generation"]))
    df = pd.concat(frames, ignore_index=True) if frames else pd.DataFrame()
    return df.drop_duplicates(["startTime", "publishTime"]) if not df.empty else df
