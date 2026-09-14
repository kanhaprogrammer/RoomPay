# Room Pay

**Split expenses. Track together. Live easier.**

Room Pay is a full-stack expense-management app for people who live together — PGs,
hostels, rented rooms, and shared flats. Create a room, invite your roommates with a
short room code, log expenses as you pay for them, and Room Pay keeps a running total
of who paid what and who owes whom.

This is a real MERN application: a React frontend talks to an Express/Node REST API,
which reads and writes everything to MongoDB. Nothing important is stored only in the
browser — refresh the page or restart the server and your rooms, members, and expenses
are still there.

---

## 1. Project overview

| | |
|---|---|
| **Frontend** | React 18 (Create React App), React Router, plain CSS |
| **Backend** | Node.js, Express |
| **Database** | MongoDB with Mongoose |
| **Auth model** | Lightweight, name-based "sessions" stored in `localStorage` — no passwords. Meant for trusted roommates, not the public internet. |

### Folder structure

```
room-pay/
├── backend/            Express API + Mongoose models
│   ├── config/         MongoDB connection
│   ├── controllers/    Route handler logic
│   ├── middleware/     Error handling helpers
│   ├── models/         Room, Member, Expense schemas
│   ├── routes/         REST endpoint definitions
│   ├── utils/          Room code generator
│   ├── .env.example
│   └── server.js
└── frontend/           React app
    └── src/
        ├── api/         fetch wrapper for the backend
        ├── components/  Reusable UI pieces
        ├── context/     Room session + toast notifications
        ├── pages/       Route-level screens
        ├── styles/      Design tokens + component/page CSS
        └── utils/       Formatting helpers, category list
```

---

## 2. Technology stack

- React 18, React Router 6
- Node.js 18+, Express 4
- MongoDB 6+/7+, Mongoose 8
- `dotenv`, `cors`
- No TypeScript, no Tailwind, no Next.js, no Firebase/Supabase, no localStorage used
  as a database (it is only used client-side to remember which room/member you are on
  this device).

---

## 3. Requirements

Install these before you start:

- **Node.js** 18 or newer and **npm** — https://nodejs.org/
- **MongoDB** — either:
  - **Local MongoDB Community Server** — https://www.mongodb.com/try/download/community, or
  - **MongoDB Atlas** (free tier, cloud-hosted, no local install) — https://www.mongodb.com/cloud/atlas/register
- **Git** (only if you're cloning from a repository rather than extracting a ZIP)

---

## 4. Installation

From the root of the extracted project, install each half separately.

### 4.1 Backend setup

```bash
cd backend
npm install
cp .env.example .env
```

Open `backend/.env` and fill in your MongoDB connection string (see section 5 below):

```
MONGODB_URI=mongodb://127.0.0.1:27017/roompay
PORT=5000
CLIENT_ORIGIN=http://localhost:3000
```

### 4.2 Frontend setup

```bash
cd frontend
npm install
cp .env.example .env
```

`frontend/.env` should point at your backend:

```
REACT_APP_API_URL=http://localhost:5000/api
```

---

## 5. MongoDB setup

You need a MongoDB connection string in `backend/.env`. Pick one option:

### Option A — Local MongoDB

1. Install MongoDB Community Server for your OS from the link above and start it
   (on most systems this is `mongod` running as a service, or `mongod --dbpath <path>`
   if you're running it manually).
2. Your connection string is simply:
   ```
   MONGODB_URI=mongodb://127.0.0.1:27017/roompay
   ```
   Mongoose will create the `roompay` database automatically the first time data is
   written — you don't need to create it manually.

### Option B — MongoDB Atlas (cloud, no local install)

1. Create a free account and a free-tier (M0) cluster at
   https://www.mongodb.com/cloud/atlas/register.
2. Under **Database Access**, create a database user with a username and password.
3. Under **Network Access**, add your current IP address (or `0.0.0.0/0` while
   developing, if you understand the security trade-off).
4. Click **Connect → Drivers**, copy the connection string, and replace
   `<username>`, `<password>`, and the database name, e.g.:
   ```
   MONGODB_URI=mongodb+srv://myuser:mypassword@cluster0.xxxxx.mongodb.net/roompay?retryWrites=true&w=majority
   ```
5. Paste that into `backend/.env`.

**Never commit a real connection string.** `.env` is already git-ignored; only
`.env.example` (with placeholder values) is part of the project.

---

## 6. Environment variables

### `backend/.env`

| Variable | Description | Example |
|---|---|---|
| `MONGODB_URI` | Full MongoDB connection string | `mongodb://127.0.0.1:27017/roompay` |
| `PORT` | Port the API listens on | `5000` |
| `CLIENT_ORIGIN` | Origin(s) allowed to call the API (comma-separated) | `http://localhost:3000` |

### `frontend/.env`

| Variable | Description | Example |
|---|---|---|
| `REACT_APP_API_URL` | Base URL of the backend API | `http://localhost:5000/api` |

---

## 7. How to run

You need **two terminals** — one for the backend, one for the frontend.

**Terminal 1 — backend**
```bash
cd backend
npm run dev        # starts with nodemon (auto-restarts on file changes)
# or: npm start    # plain node, no auto-restart
```
You should see:
```
MongoDB connected: <host>/roompay
Room Pay API running on port 5000
```

**Terminal 2 — frontend**
```bash
cd frontend
npm start
```
This opens `http://localhost:3000` in your browser automatically.

---

## 8. How to test the application

A full manual test pass, in order:

1. **Start MongoDB** (if running locally), then start the backend and frontend as above.
2. Open `http://localhost:3000`. You should see the Room Pay homepage with **Create
   Room** and **Join Room** buttons.
3. Click **Create Room**, enter a room name (e.g. "Boys PG Room") and your name (e.g.
   "Kanha"), and submit. You should land on a success screen showing a generated room
   code.
4. Click **Copy Room Code**, then **Go to Room** to land on the dashboard. Confirm the
   stat strip shows 1 member, 0 expenses, ₹0 total.
5. Open a **second browser** or an **incognito window** at `http://localhost:3000`,
   click **Join Room**, paste the room code, enter a different name (e.g. "Rahul"),
   and submit. You should land directly on the same room's dashboard.
6. In the first window (Kanha), go to **Add Expense**, add "Milk" for ₹80, paid by
   Kanha, category Groceries, and submit. Confirm you're redirected to the dashboard
   and the stats/recent-expenses/member totals update immediately.
7. In the second window (Rahul), add another expense (e.g. "Vegetables", ₹250, paid
   by Rahul). Refresh the first window and confirm the new total, member split, and
   recent expenses list all reflect both expenses.
8. Go to **Expenses**, try the search box, the member filter, the category filter,
   and each sort option.
9. Edit an expense (change the amount) and confirm the dashboard totals update. Delete
   an expense and confirm totals update again, with a confirmation dialog appearing
   first.
10. Go to **Members** and confirm each member's total paid, expense count, and join
    date look correct, and that balances ("gets back" / "owes") add up sensibly.
11. **Refresh the browser** on the dashboard — the room, members, and expenses should
    all still be there (proving data lives in MongoDB, not just React state).
12. Click **Leave Room** on one of the two sessions, confirm the dialog, and confirm
    you're returned to the homepage and can no longer see that room from that browser.
13. Try invalid inputs: joining with a made-up room code (should show "Room not found"),
    submitting a form with an empty required field, or entering a negative/zero expense
    amount — each should show a clear inline or toast error, never a raw server error.
14. Stop the backend (`Ctrl+C`) and restart it — reload the dashboard and confirm all
    data is still present, proving persistence through MongoDB rather than server memory.

---

## 9. API documentation

Base URL: `http://localhost:5000/api` (or whatever `REACT_APP_API_URL`/`PORT` you configure).

### Rooms

| Method | Endpoint | Body | Description |
|---|---|---|---|
| `POST` | `/rooms` | `{ roomName, name }` | Create a room; creates the room and its first member (the creator). |
| `POST` | `/rooms/join` | `{ roomCode, name, roomName? }` | Join an existing room by code. Rejoining with the same name reuses the existing member. |
| `GET` | `/rooms/:roomCode` | — | Room details plus computed stats: totals, member count, expense count, equal share, per-member balances, and the 5 most recent expenses. |
| `GET` | `/rooms/:roomCode/members` | — | List of members (name, creator status, join date). |
| `DELETE` | `/rooms/:roomCode/members/:memberId` | — | Leave a room. If the creator leaves, ownership transfers to the next-earliest-joined member; if the room becomes empty, it's archived. |
| `POST` | `/rooms/:roomCode/members/:memberId/kick` | `{ requesterId }` | Room creator removes another member. Rejected with `403` unless `requesterId` is the current creator. |

### Expenses

| Method | Endpoint | Body / Query | Description |
|---|---|---|---|
| `POST` | `/expenses` | `{ roomCode, item, amount, date?, note? }` | Add an expense. |
| `GET` | `/expenses/:roomCode` | `?search=&dateFrom=&dateTo=&sort=newest\|oldest\|highest\|lowest` | List expenses for a room, with optional search/date filtering and sorting. |
| `GET` | `/expenses/:roomCode/recent` | `?limit=5` | Most recent expenses for a room. |

There are intentionally no edit or delete endpoints for expenses — see section 11.

Every response is JSON. Errors come back as `{ "message": "..." }` with an appropriate
HTTP status code (`400` for bad input, `404` for not found, `409` for a duplicate
member name, `500` for unexpected server errors — with the raw error only logged
server-side, never sent to the client).

---

## 10. Troubleshooting

**"MongoDB connection failure" / server exits immediately on start**
- Confirm MongoDB is actually running (`mongod` process, or that your Atlas cluster
  is not paused).
- Double check `MONGODB_URI` in `backend/.env` — no quotes around the value, and for
  Atlas make sure the password doesn't contain characters that need URL-encoding
  (`@`, `:`, `/`, etc.).
- For Atlas, confirm your current IP is allow-listed under **Network Access**.

**"Port already in use"**
- Something else is already listening on port 5000 (backend) or 3000 (frontend).
  Either stop that process or change `PORT` in `backend/.env` (and update
  `REACT_APP_API_URL` in `frontend/.env` to match).

**`npm install` errors**
- Make sure you're on Node 18+ (`node -v`). Delete `node_modules` and
  `package-lock.json` and try again if a previous partial install left things in a
  bad state.

**CORS errors in the browser console**
- Make sure `CLIENT_ORIGIN` in `backend/.env` matches the exact origin the frontend
  is served from (protocol + host + port), and restart the backend after changing it.

**Frontend loads but "Can't reach the Room Pay server"**
- The backend isn't running, or `REACT_APP_API_URL` in `frontend/.env` doesn't match
  where it's actually listening. Remember Create React App only reads `.env` at
  start-up — restart `npm start` after changing it.

**Invalid environment variables**
- If `backend/.env` is missing entirely, the server logs a clear message and exits
  rather than crashing with a raw stack trace — copy `.env.example` again if needed.

**"Room not found" when you know the code is right**
- Room codes are case-insensitive but must otherwise match exactly. Also check that
  the room wasn't auto-archived after its last member left (see the Leave Room
  behavior above).

---

## 11. Changes from the original spec

The app has been simplified from its original design based on later feedback:

- **Expenses no longer track who paid.** An expense is just an item, an amount, a
  date, and an optional note — logged by whoever is in the room, not attributed to
  a specific payer. As a result, per-member "total paid" / "your spending" figures
  and the paid-vs-owed balance summary have been removed, since they can't be
  computed without knowing who paid for what. The dashboard still shows total
  expenses, total members, expense count, and an informational equal-share figure
  (total ÷ members).
- **No expense categories.** Expenses aren't categorized, and there's no category
  filter on the Expenses page.
- **Expenses can be edited but not deleted.** The delete-expense feature (button,
  confirmation dialog, and backend endpoint) has been removed entirely.
- **Joining a room only asks for the room code and your name** — the optional room
  name field on Join Room was removed.
- **Room creators can remove (kick) a member.** Useful when someone has moved out
  but forgot to leave the room themselves. Only the current creator sees this
  option, and a creator can't kick themselves (use Leave Room instead).
- **Ownership transfer on leave/kick** still works as before: if the creator leaves,
  the next-earliest-joined remaining member automatically becomes the new creator;
  if a room becomes empty, it's archived.
- **Expenses can no longer be edited or deleted** — once logged, an expense is
  permanent. There's no edit button, no `PUT /expenses/:id`, and no delete option.
- **Route access is tied to your room session:**
  - Visiting `/dashboard`, `/dashboard/expenses`, `/dashboard/members`, or
    `/dashboard/add-expense` by typing the URL directly without a room session
    redirects you to the homepage.
  - If you *do* have a room session, the homepage, Create Room, and Join Room pages
    all redirect you straight to `/dashboard` instead — you can't start or join a
    different room until you Leave Room first.
  - The dashboard is effectively the "home" page for anyone currently in a room.

## 12. Notes on design decisions

- **Room codes** are 6 characters from an alphabet that excludes visually confusing
  characters (`0`/`O`, `1`/`I`/`L`) so they're easy to read back over a phone call or
  a WhatsApp message.
- **Balances** use simple equal-split math (total ÷ active members), deliberately
  avoiding a full debt-settlement/minimization algorithm to keep the first version
  easy to reason about, per the product brief.
- **Sessions** are per-browser, stored in `localStorage` as a room code + member id.
  This is intentionally lightweight (no passwords) since the audience is roommates who
  already trust each other with a shared room code — it is not intended to be exposed
  to the open internet as-is.
