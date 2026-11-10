# Room Pay

Split shared expenses with your roommates. No accounts - people join a room with a short code.

- **frontend/** - React 18 + Vite + React Router
- **backend/** - Express + MongoDB (Mongoose)

## Quick start (local)

Requires **Node 20+**. You also need a MongoDB: a free [Atlas](https://www.mongodb.com/atlas) cluster, or local via Docker.

```bash
npm run setup          # installs everything, creates backend/.env + frontend/.env
npm run db:up          # optional: local MongoDB in Docker (skip if you use Atlas)
npm run dev            # API on :5000, app on :5173
```

Open http://localhost:5173. Check the API at http://localhost:5000/api/health.

`npm run setup` flags: `--yes` (no prompts), `--uri="mongodb+srv://..."`, `--test` (run unit tests after), `--force` (overwrite `.env` files).

## Tests

```bash
npm run test:unit      # fast, no database needed
npm test               # + API tests against a real MongoDB
```

`npm test` starts an in-memory MongoDB (binary downloaded once, needs internet). To use your own server instead:
`MONGODB_TEST_URI=mongodb://127.0.0.1:27017 npm test --prefix backend` (a throw-away database is created and dropped).

## Configuration

| File | Variable | Purpose |
| --- | --- | --- |
| `backend/.env` | `MONGODB_URI` | MongoDB connection string. **Include a database name** (`.../roompay?...`) or Mongo uses `test`. |
| | `CLIENT_ORIGIN` | Comma-separated allowed frontend origins (CORS). Supports `https://*.vercel.app`. |
| | `PORT` | API port (Render sets it). |
| | `MONGODB_DB` | Optional database name override. |
| `frontend/.env` | `VITE_API_URL` | API base URL including `/api`. |

`.env` files are git-ignored. Never commit real credentials.

## Deploy

Deploy the **API on Render first**, then the **frontend on Vercel**, then point each at the other.

### 1. MongoDB Atlas
Create a free cluster, add a database user, and under *Network Access* allow `0.0.0.0/0` (Render's IPs aren't fixed). Copy the connection string and add the database name, e.g. `mongodb+srv://USER:PASS@cluster.mongodb.net/roompay?retryWrites=true&w=majority`.

### 2. Backend on Render
1. Push this repo to GitHub.
2. Render -> **New -> Blueprint** -> select the repo (it reads `render.yaml`).
   *(Or New -> Web Service: root directory `backend`, build `npm ci --omit=dev`, start `npm start`, health check `/api/health`.)*
3. Set env vars: `MONGODB_URI` = your Atlas string, `CLIENT_ORIGIN` = `https://<your-app>.vercel.app` (you can set a placeholder and update it after step 3).
4. Deploy, then open `https://<service>.onrender.com/api/health` - it should say `"database": "connected"`.

Free Render services sleep when idle; the first request after a pause can take ~30-60 s (the app waits up to 60 s and shows a friendly message).

### 3. Frontend on Vercel
1. Vercel -> **Add New -> Project** -> import the repo.
2. Set **Root Directory** to `frontend` (framework auto-detects as Vite; `vercel.json` already adds the SPA rewrite so page refreshes and deep links work).
3. Add env var `VITE_API_URL` = `https://<service>.onrender.com/api`.
4. Deploy. Then go back to Render and make sure `CLIENT_ORIGIN` matches the final Vercel URL (no path). Preview deployments work with `https://*.vercel.app`.

> `VITE_*` variables are baked in at **build time** - redeploy the frontend after changing `VITE_API_URL`.

### CLI alternative
```bash
cd frontend && npx vercel --prod      # prompts to log in / link the project
```

## Pushing to GitHub

If your old `backend/` folder has its own `.git`, remove that nested repository first (a repo inside a repo is pushed as an empty "submodule"):

```bash
rm -rf backend/.git          # Windows: rmdir /s /q backend\.git
git init && git add . && git commit -m "Room Pay: Vite frontend + hardened API"
git remote add origin https://github.com/<you>/RoomPay.git
git push -u origin main
```

## How access works (read this before going public)

There are no passwords: **the room code is the secret**. Anyone with a code can join, add expenses, and see members; joining with an existing name signs you in as that member (so you can continue on a new phone). Only the room creator can remove others. That fits a flat/PG sharing a code over WhatsApp, but it is not suitable for sensitive data. Add real authentication before using it beyond that.

## API

| Method | Path | |
| --- | --- | --- |
| GET | `/api/health` | liveness + DB status |
| POST | `/api/rooms` | create room `{roomName, name}` |
| POST | `/api/rooms/join` | join `{roomCode, name}` |
| GET | `/api/rooms/:code` | overview + stats |
| GET | `/api/rooms/:code/members` | active members |
| DELETE | `/api/rooms/:code/members/:id` | leave |
| POST | `/api/rooms/:code/members/:id/kick` | creator removes member `{requesterId}` |
| POST | `/api/expenses` | add `{roomCode, item, amount, date?, note?}` |
| GET | `/api/expenses/:code` | list (`search`, `sort=newest\|oldest\|highest\|lowest`, `dateFrom`, `dateTo`) |
| GET | `/api/expenses/:code/recent` | latest (`limit` 1-20) |

## Troubleshooting

- **CORS error in the browser** - `CLIENT_ORIGIN` on the API doesn't exactly match the frontend origin (scheme + host, no path).
- **"Can't reach the Room Pay server"** - wrong `VITE_API_URL`, or the Render service is still waking up.
- **Blank page / 404 on refresh at Vercel** - Root Directory must be `frontend` so `vercel.json` is picked up.
- **Backend exits on start** - read the first log line; usually a bad/missing `MONGODB_URI` or Atlas network access.
