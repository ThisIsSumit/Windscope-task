# WindScope frontend

React, TypeScript, Vite, Tailwind, Recharts, Framer Motion, GSAP, React Router.

## Routes
- `/` marketing site (landing page)
- `/app` web app: Overview
- `/app/analysis` daily error, error spread, sortable table, CSV download
- `/app/replay` cutoff replay for one delivery half hour
- `/app/methodology` sources, selection rule, metrics, limits

## Run
```bash
npm install
npm run dev          # http://localhost:5173
npm run build && npm run preview
```
The app reads from the backend at `VITE_API_URL` (default `http://localhost:8000`):
```bash
VITE_API_URL=https://your-backend.example.com npm run build
```
Endpoints used: `/api/analytics/summary`, `/api/analytics/errors`, `/api/forecast/history`.

## Deploy (Vercel)
Root directory `frontend`, set `VITE_API_URL`. `vercel.json` rewrites all paths to `index.html` so `/app/...` works on refresh.
