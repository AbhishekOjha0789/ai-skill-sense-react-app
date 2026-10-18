# AI Skill Sense frontend

React + Vite + Tailwind CSS v4.

## Run locally
    npm install
    cp .env.example .env
    npm run dev

## Backend
The frontend uses the backend root URL, not an `/api/v1` prefix:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
VITE_USE_MOCK=false
```

The backend must allow the frontend origin in `FRONTEND_ORIGINS`, for example
`http://localhost:5173`. For production, use the deployed HTTPS backend URL and
add the deployed frontend origin to that backend setting.
Set backend `PUBLIC_API_BASE_URL` to its externally reachable HTTPS root when
running behind a reverse proxy so generated webhook URLs use the public host.

The Connections page can create/revoke an account-specific activity webhook
URL. Third-party services post JSON containing `activity_type`, `log_desc`, and
a stable `event_id` to that URL. The URL itself is the bearer credential; keep
it private.

Google Health Connect requires the native Android companion in
`../android-health-connect`. The web page creates a short-lived pairing code;
the Android app requests Health Connect permissions and performs the data sync.
These Vite values are build-time settings: change them in the hosting
environment and redeploy.

## Deploy
Build command `npm run build`, output directory `dist`.
- Vercel: import the repo. `vercel.json` handles page refreshes on routes like /dashboard.
- Netlify or Render Static Site: `public/_redirects` handles the same. On Render add a rewrite rule `/*` to `/index.html`.
