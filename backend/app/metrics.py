import numpy as np, pandas as pd

MAPE_MIN_ACTUAL_MW = 1.0  # actuals below this are excluded from percentage metrics

def add_errors(df: pd.DataFrame) -> pd.DataFrame:
    """df needs `actual` and `forecast` (MW). error = forecast - actual (+ = over-forecast)."""
    out = df.copy()
    out["error"] = out["forecast"] - out["actual"]
    out["abs_error"] = out["error"].abs()
    valid = out["actual"].abs() >= MAPE_MIN_ACTUAL_MW
    out["pct_error"] = np.where(valid, out["error"] / out["actual"] * 100, np.nan)
    return out

def summarize(df: pd.DataFrame) -> dict:
    d = add_errors(df).dropna(subset=["actual", "forecast"])
    if d.empty:
        return {"n": 0, "mae": None, "rmse": None, "bias": None, "mape": None, "mape_excluded": 0,
                "mean_forecast": None, "mean_actual": None}
    pct = d["pct_error"].dropna()
    return {
        "n": int(len(d)),
        "mae": float(d["abs_error"].mean()),
        "rmse": float(np.sqrt((d["error"] ** 2).mean())),
        "bias": float(d["error"].mean()),
        "mape": float(pct.abs().mean()) if len(pct) else None,
        "mape_excluded": int(len(d) - len(pct)),
        "mean_forecast": float(d["forecast"].mean()),
        "mean_actual": float(d["actual"].mean()),
    }
