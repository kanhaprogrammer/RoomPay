# What changed vs. the original

## Security
- The original zip contained a `.env` with **live MongoDB Atlas credentials**. It is not included here (`.env.example` files instead). **Rotate that database password** in Atlas.
- Added `helmet`, rate limiting, 10 kB body limit, stricter CORS (wildcards, trailing slashes), `crypto`-based room codes.
- Search text is regex-escaped (a `(` in the search box used to cause a 500 / could be used for ReDoS).
- Every input is type-checked (arrays/objects in JSON used to cause 500s or reach Mongo queries).
- Removed unused `bcryptjs` / `jsonwebtoken`; dependencies updated, `npm audit` clean for production deps.

## Backend bugs fixed
- Invalid dates / `Infinity` / absurd amounts were accepted or returned a misleading "Invalid ID" error. Now validated with clear messages (amount rounded to paise, max ₹1 crore).
- Expense dates are stored as calendar days (UTC midnight) so they no longer show as the previous day for users west of UTC.
- `dateTo` filter excluded the whole end day.
- Duplicate-key error always said "name already used", even for room-code collisions. Room-code collisions now retry safely; simultaneous joins with the same name no longer error.
- Creating a room could leave an orphaned room if member creation failed.
- Ownership transfer now also updates `room.createdBy`.
- Room totals are computed in MongoDB instead of loading every expense; stable sorting.
- Duplicate Mongoose index warnings removed; DB failures no longer `process.exit` inside library code; graceful SIGTERM shutdown; `/api/health` reports DB state.
- Split into `app.js` / `server.js` so the API is testable.

## Frontend bugs fixed
- **Create room redirect bug:** the "Room created" page flashed then bounced to the dashboard (the new session tripped `PublicOnlyRoute`). Session is now saved from the "Room created" page.
- Every refresh (e.g. after adding an expense) blanked the whole app with a loader; now only the first load shows it.
- A member removed by the creator could keep using the room; now shown a clear "you're no longer in this room" screen. "Leave room" no longer gets stuck on a 404.
- Dashboard no longer flashes an error screen right after joining; error screen has a Retry button.
- Expense search fired a request per keystroke and could show out-of-order results; now debounced with stale-response protection.
- Toast/room context values were re-created every render; corrupted `localStorage` sessions are ignored; clipboard failures handled; Escape closes dialogs.
- Form inputs have length limits matching the API; stale-state typing bug in the Add Expense form fixed.
- Home page copy claimed it shows "who paid and who owes", which the app doesn't do - reworded.
- API client: request timeout (for sleeping free-tier servers), URL-encoded path segments, status codes on errors.
- Dashboard quietly re-syncs when you return to the tab.

## Vite migration
CRA (`react-scripts`) -> Vite 6. `.js` JSX files renamed to `.jsx`, `index.html` moved to the project root, `REACT_APP_API_URL` -> `VITE_API_URL`, `vercel.json` SPA rewrite added.
