# Room Pay — Install Checklist

Everything you need to install, in the order you'd actually run it. Two separate
folders (`backend/`, `frontend/`), two separate `npm install` runs.

---

## 0. Before you touch npm

Install these system-level tools first:

- **Node.js 18+** and **npm** → https://nodejs.org/
- **MongoDB** — pick one:
  - Local: MongoDB Community Server → https://www.mongodb.com/try/download/community
  - Cloud (no local install): MongoDB Atlas free tier → https://www.mongodb.com/cloud/atlas/register

Check you have Node/npm:
```bash
node -v
npm -v
```

---

## 1. Backend — `cd backend`

```bash
npm install express mongoose dotenv cors
npm install --save-dev nodemon
```

| Package | Why it's needed |
|---|---|
| `express` | The web server / REST API framework |
| `mongoose` | Talks to MongoDB — schemas, models, queries |
| `dotenv` | Loads `MONGODB_URI`, `PORT`, etc. from `.env` |
| `cors` | Lets the React app (different port) call this API |
| `nodemon` *(dev only)* | Auto-restarts the server when you edit files |

Then copy the env template and fill in your Mongo connection string:
```bash
cp .env.example .env
```

Run it:
```bash
npm run dev      # nodemon, auto-restart
# or
npm start        # plain node
```

**Not installed, and not needed for this app:** `jsonwebtoken`, `bcryptjs`,
`passport`, `express-session`. Room Pay doesn't have logins/passwords — a member
is just a name inside a room, and the browser remembers "which room/member am I"
via `localStorage`, not a server session or token. If you later want real login
accounts (so a name can't be spoofed by anyone who has the room code), that's when
you'd add:
```bash
npm install jsonwebtoken bcryptjs
```
but the app as built doesn't require it.

---

## 2. Frontend — `cd frontend`

```bash
npm install react react-dom react-router-dom react-scripts
```

(In practice `npm install` with no arguments does this for you — everything's
already listed in `package.json`. The list above is just so you know what each
piece is for.)

| Package | Why it's needed |
|---|---|
| `react`, `react-dom` | The UI library |
| `react-router-dom` | Client-side routing (Home, Dashboard, Expenses, etc. without full page reloads) |
| `react-scripts` | Create React App's build/dev tooling (`npm start`, `npm run build`) |

Then copy the env template and point it at your backend:
```bash
cp .env.example .env
```

Run it:
```bash
npm start
```

**Not installed, and not needed:** `axios` (plain `fetch` is used instead — one
less dependency), `redux`/`zustand` (React Context handles the small amount of
shared state), `tailwindcss` (plain CSS per the project's requirements).

---

## 3. Quick copy-paste version

```bash
# backend
cd backend
npm install
cp .env.example .env
npm run dev

# frontend (in a second terminal)
cd frontend
npm install
cp .env.example .env
npm start
```

Since `package.json` in both folders already lists every dependency above, a
plain `npm install` in each folder is really all you need — the per-package
`npm install express mongoose ...` commands are there so you know exactly what
got installed and why.
