import pandas as pd

LONDON = "Europe/London"

def select_forecast(forecasts: pd.DataFrame, start_time, cutoff) -> dict | None:
    """Latest forecast for `start_time` with publishTime <= cutoff (all tz-aware). None if none eligible."""
    start_time, cutoff = pd.Timestamp(start_time), pd.Timestamp(cutoff)
    f = forecasts[(forecasts.startTime == start_time) & (forecasts.publishTime <= cutoff)]
    if f.empty:
        return None
    return f.sort_values("publishTime").iloc[-1].to_dict()

def cutoff_for(start_times: pd.Series, hour: int = 10, minute: int = 0, days_before: int = 1) -> pd.Series:
    """Cutoff (UTC) per delivery interval: (London delivery date - days_before) at hour:minute London time."""
    local_day = start_times.dt.tz_convert(LONDON).dt.tz_localize(None).dt.normalize()
    naive = local_day - pd.Timedelta(days=days_before) + pd.Timedelta(hours=hour, minutes=minute)
    return naive.dt.tz_localize(LONDON, ambiguous="NaT", nonexistent="shift_forward").dt.tz_convert("UTC")

def select_all(forecasts: pd.DataFrame, hour=10, minute=0) -> pd.DataFrame:
    """Vectorised rule for every interval; keeps startTime, publishTime, generation as `forecast`."""
    f = forecasts.copy()
    f["cutoff"] = cutoff_for(f.startTime, hour, minute)
    f = f[f.publishTime <= f.cutoff]
    f = f.sort_values("publishTime").groupby("startTime", as_index=False).tail(1)
    return f.rename(columns={"generation": "forecast"})[["startTime", "publishTime", "cutoff", "forecast"]]
