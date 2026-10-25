import pandas as pd, numpy as np
from app.selection import select_forecast, select_all, cutoff_for
from app.metrics import summarize

T = pd.Timestamp("2026-01-15 10:00", tz="UTC")
F = pd.DataFrame({"startTime": [T]*3, "publishTime": pd.to_datetime(["2026-01-14 08:00","2026-01-14 10:00","2026-01-14 13:00"], utc=True),
                  "generation": [14000, 14500, 15200]})

def test_spec_example_selects_14500():
    assert select_forecast(F, T, pd.Timestamp("2026-01-14 12:00", tz="UTC"))["generation"] == 14500

def test_publish_exactly_at_cutoff_is_eligible():
    assert select_forecast(F, T, pd.Timestamp("2026-01-14 13:00", tz="UTC"))["generation"] == 15200

def test_none_eligible():
    assert select_forecast(F, T, pd.Timestamp("2026-01-14 07:00", tz="UTC")) is None

def test_cutoff_is_previous_day_london():
    assert cutoff_for(pd.Series([T]), 12, 0).iloc[0] == pd.Timestamp("2026-01-14 12:00", tz="UTC")

def test_select_all_excludes_late_forecast():
    out = select_all(F, 12, 0)
    assert len(out) == 1 and out.forecast.iloc[0] == 14500

def test_metrics_and_sign_convention():
    s = summarize(pd.DataFrame({"actual": [100., 200., 0.], "forecast": [110., 180., 5.]}))
    assert s["mae"] == (10+20+5)/3 and s["bias"] == (10-20+5)/3
    assert np.isclose(s["rmse"], np.sqrt((100+400+25)/3))
    assert s["mape_excluded"] == 1 and np.isclose(s["mape"], 10.0)
    assert np.isclose(s["mean_forecast"], 295/3) and np.isclose(s["mean_actual"], 100.0)

def test_empty_and_missing():
    assert summarize(pd.DataFrame({"actual": [], "forecast": []}))["n"] == 0
    assert summarize(pd.DataFrame({"actual": [1.0, None], "forecast": [None, 2.0]}))["n"] == 0
