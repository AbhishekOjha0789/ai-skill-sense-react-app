# AI Skill Sense frontend

React + Vite + Tailwind CSS v4.

## Run locally
    npm install
    cp .env.example .env
    npm run dev

## Backend
`VITE_USE_MOCK=true` (default) uses built-in demo data and makes no network calls.
When your real API is ready, set `VITE_USE_MOCK=false` and `VITE_API_BASE_URL=https://your-backend.onrender.com/api/v1`.
These are build-time values: change them in your host's environment settings and redeploy.

## Deploy
Build command `npm run build`, output directory `dist`.
- Vercel: import the repo. `vercel.json` handles page refreshes on routes like /dashboard.
- Netlify or Render Static Site: `public/_redirects` handles the same. On Render add a rewrite rule `/*` to `/index.html`.
