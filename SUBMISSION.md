# Setup, test, run, submit

## 1. Setup and run (needs Docker, or Python 3.12 + Node 20)
```bash
docker compose up --build        # app :3000, API :8080, Swagger :8080/docs
```
Or without Docker: see README.md "Run".

## 2. Test
```bash
cd backend
python -m venv .venv
# Windows Git Bash: source .venv/Scripts/activate
# Windows PowerShell: .venv\Scripts\Activate.ps1
# macOS/Linux: source .venv/bin/activate
python -m pip install -r requirements.txt
python -m pytest -q   # expect 7 passed
```

Run the API with `python -m uvicorn app.main:app --reload --port 8080`
and set `VITE_API_URL=http://localhost:8080` for the frontend.

## 3. Verify live data FIRST (not yet verified by the author)
Open http://localhost:8080/api/analytics/summary?start=2026-01-01&end=2026-01-03
- `coverage.matched` should be above 0.
- `coverage.forecast_versions_per_interval_max` above 1 means WINDFOR exposes revision history, so the cutoff replay is real.
- If it is 1 or less, the app shows a limitation banner. Keep that honest wording in the video and README.
- If the call errors, check `BASE` in `backend/app/elexon.py` and the parameter names against the Elexon docs.

## 4. Look at the UI
Check desktop and phone width: hero, KPI cards, both charts, the cutoff slider, error and empty states.

## 5. Deploy (needs your accounts)
- Backend on Render: Docker web service, root `backend`, health check `/api/health`.
- Frontend on Vercel: root `frontend`, env `VITE_API_URL=<render backend URL>`.
- Open both URLs in an incognito window. Then put the real URLs in README.md.

## 6. GitHub
Create a public repo with a random name, push this folder. `.gitignore` already excludes `.env` and `node_modules`.

## 7. Video (max 10 min, unlisted YouTube)
Part 1, client, up to 5 min: the problem (buying day ahead on a wind forecast), the hero, the replay slider on one real interval, the KPI cards with the real MAE, RMSE and bias, what the bias means for buying, and the caveat that error is not a financial loss.
Part 2, tech lead, up to 5 min: architecture (React to FastAPI to Elexon), `elexon.py` windowing by publishTime, `selection.py` rule and its test, `metrics.py` sign convention and MAPE exclusion, caching with stale flag, Docker and tests.
Fill in numbers only from your own run. Do not quote figures you have not seen.

## 8. Submit
Fill the form with the repo URL, frontend URL, and video URL. Open each in incognito first. Keep the AI disclosure in the README.
