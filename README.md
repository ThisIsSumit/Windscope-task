# WindScope: UK wind forecast and procurement analytics

Replays the wind forecast Elexon had published at a chosen day ahead decision cutoff, then scores it against actual GB wind generation for January 2026.

## Status
- Backend logic (cutoff selection, metrics) is covered by 7 pytest tests, which pass.
- **Not yet verified against live Elexon data.** If WINDFOR returns only one forecast version per interval, the app shows a limitation banner and does not claim decision time accuracy.
- Deployed URLs: [WindScope](https://frontend-six-red-20.vercel.app/) || [Backend API](https://windscope-api-isb4.onrender.com)



## Data
| Source | Endpoint | Fields used |
|---|---|---|
| Actual | FUELHH stream, `fuelType=WIND`, settlement date params | startTime, generation (average MW per half hour) |
| Forecast | WINDFOR stream, publishDateTime params | startTime, publishTime, generation (MW) |

Timestamps are timezone aware, held in UTC, and shown in Europe/London (GMT in January).

## Forecast selection
For each delivery half hour t, the selected forecast is the latest one with `startTime = t` and `publishTime <= cutoff`. The cutoff is the previous day at a configurable London time (default 10:00). These are analysis scenarios, not a verified procurement deadline. Code: `backend/app/selection.py`.

## Metrics (`backend/app/metrics.py`)
Error = forecast minus actual, so positive means over forecast.
- **MAE**: mean absolute error, MW.
- **RMSE**: root mean squared error, MW.
- **Bias**: mean error, MW.
- **MAPE**: excludes intervals where actual is under 1 MW; the excluded count is reported.
- **Coverage**: expected, actual, forecast and matched intervals are all reported.

## Run
```bash
docker compose up --build        # frontend :3000, backend :8080, Swagger :8080/docs
```
Without Docker:
```bash
cd backend
python -m venv .venv
# Windows PowerShell:
.venv\Scripts\Activate.ps1
# Windows Git Bash:
source .venv/Scripts/activate
# macOS/Linux:
source .venv/bin/activate
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8080
cd ..
python -m pytest backend         # tests
cd frontend && npm install && npm run dev
```
Set `VITE_API_URL=http://localhost:8080` before starting the frontend
(or in `frontend/.env.local`) if it is not already configured.
Set `VITE_API_URL` (see `.env.example`) when the backend is not on localhost:8080.

## Layout
- `backend/app/elexon.py`: API client with retries and publish time windowing
- `backend/app/selection.py`, `metrics.py`: core analytics
- `backend/app/main.py`: FastAPI routes, 10 minute cache, stale fallback flagged as cached
- `backend/tests/`: pytest
- `frontend/src/`: React, TypeScript, Tailwind, Recharts


