# Notes. — Personal Notes App (MERN)

A secure, multi-user note-taking web app. Every user registers, logs in and gets their **own private notebook**: create, edit, delete, search, tag, colour, pin and **lock** notes with a password. Built with **MongoDB + Express + React + Node.js**, with a "graph-paper notebook" design.

![Notes dashboard](docs/screenshots/dashboard.png)

---

## 1. Features

| Area | What it does |
|---|---|
| **Authentication** | Register / log in with email + password. Passwords hashed with **bcrypt**; sessions use **JWT** tokens. Rate-limited login. |
| **Protected routes** | Backend: every `/api/notes` route requires a valid token (`protect` middleware). Frontend: `ProtectedRoute` redirects guests to `/login`. |
| **Data isolation** | Every database query includes `user: req.user._id`, so a user can never read/edit/delete another user's note — even with its id (returns 404). |
| **CRUD** | Create (quick-add bar or full form), open & edit in a dialog, delete with confirmation **and Undo**. |
| **Search** | Live search (debounced) across title, content and tags; matches are highlighted. |
| **Tags** | Add tags as chips (Enter / comma), autocomplete from existing tags, filter by tag from the sidebar or by clicking a tag on a note. |
| **Pin** | Pinned notes always appear first in their own section. |
| **Locked notes** | Protect any note with a separate **lock password** (bcrypt-hashed). A locked note shows only its title; its content and tags never leave the server until the password is typed — and it is asked **every time** the note is opened. Editing, deleting or removing the lock also needs it. Locked notes cannot be found by their content in search. Set / change the lock password from the sidebar. |
| **Colours** | Six paper colours per note. |
| **Sort & layout** | Sort by last edited / newest / oldest / title; grid or list view (remembered). |
| **Smart dates** | `Created 2 hrs ago` for notes under a day old, `14/10/2026` for older ones, `Edited 3 hrs ago` for same-day edits, and `15/10/2026 (edited)` when a note was edited more than a day after it was created. Pinning or locking is not counted as an edit. |
| **Counts** | Sidebar counts of all, pinned and locked notes, plus per-tag counts (MongoDB aggregation). |
| **Export** | Download all your notes as a JSON file. |
| **UX details** | Loading skeletons, empty states, error states with retry, toasts, unsaved-changes warning, word/character count, keyboard shortcuts (`/` search, `N` new note, `Ctrl+Enter` save, `Esc` close), responsive mobile layout, accessible labels. |
| **Validation** | Client-side (forms) **and** server-side (whitelisted fields, length limits, types) with per-field error messages. |
| **Tests** | 23 automated API tests (Jest + Supertest + in-memory MongoDB). |

---

## 2. Tech stack

- **Frontend:** React 18, React Router 6, Axios, Vite, plain CSS (Google Fonts: *Courier Prime* & *Space Mono*)
- **Backend:** Node.js, Express 4, Mongoose 8, JSON Web Tokens, bcryptjs, Helmet, CORS, express-rate-limit, Morgan
- **Database:** MongoDB (local, Atlas, or the built-in embedded MongoDB)
- **Testing:** Jest, Supertest, mongodb-memory-server

---

## 3. How to run (step by step)

**You need:** [Node.js 18 or newer](https://nodejs.org) (includes npm). MongoDB is **optional** — see step 3.

```bash
# 1. Clone the repository
git clone https://github.com/DevikaJanardanan/personalnotes.git
cd personalnotes

# 2. Install everything (root, server and client)
npm run install-all

# 3. Create the server's environment file
#    Windows (PowerShell):  copy server\.env.example server\.env
#    macOS / Linux:         cp server/.env.example server/.env

# 4. Start the API and the website together
npm run dev
```

Then open **http://localhost:5173** → click **Create an account** → start writing notes.

**About the database:** if `MONGO_URI` in `server/.env` is left empty, the server automatically starts an **embedded MongoDB** and saves the data in `server/.data/` (the first start downloads the MongoDB binary once, so it may take a minute). To use your own database instead, set for example:

```
MONGO_URI=mongodb://127.0.0.1:27017/notes_app          # MongoDB installed on your PC
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/notes_app   # MongoDB Atlas
```

Other commands:

| Command | What it does |
|---|---|
| `npm run server` | Start only the API (http://localhost:5000/api) |
| `npm run client` | Start only the React app |
| `npm test` | Run the API test suite |
| `npm run build` | Production build of the React app (`client/dist`) |

---

## 4. Project structure

```
mini_project/
├── package.json              ← root scripts (install-all, dev, test)
├── README.md
├── server/                   ← Express REST API
│   ├── .env.example
│   ├── requests.http         ← ready-made API requests (VS Code REST Client)
│   ├── src/
│   │   ├── server.js         ← starts DB + HTTP server
│   │   ├── app.js            ← Express app: middleware + routes
│   │   ├── config/db.js      ← MongoDB connection (or embedded MongoDB)
│   │   ├── models/
│   │   │   ├── User.js       ← user schema, password hashing
│   │   │   └── Note.js       ← note schema, tag normalisation, indexes
│   │   ├── middleware/
│   │   │   ├── auth.js       ← protect: verifies the JWT
│   │   │   ├── validate.js   ← request body validation + whitelisting
│   │   │   └── errorHandler.js ← 404 + consistent JSON errors
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   └── noteController.js
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   └── noteRoutes.js
│   │   └── utils/            ← ApiError, asyncHandler
│   └── tests/api.test.js     ← Jest + Supertest tests
└── client/                   ← React (Vite) frontend
    ├── index.html
    ├── vite.config.js        ← proxies /api → localhost:5000
    └── src/
        ├── main.jsx, App.jsx ← entry + routes
        ├── api/              ← Axios instance + REST calls
        ├── context/          ← AuthContext (login state), ToastContext
        ├── hooks/useDebounce.js
        ├── components/       ← NoteCard, NoteComposer, NoteForm, NoteEditor,
        │                       TagInput, Sidebar, Header, PasswordPrompt,
        │                       LockPasswordDialog, Modal, …
        ├── pages/            ← NotesPage, AuthPage (login/register), NotFound
        ├── utils/format.js   ← dates, highlighting, constants
        └── styles/index.css  ← the whole design system
```

---

## 5. Database schemas (Mongoose)

**User**

| Field | Type | Rules |
|---|---|---|
| `name` | String | required, ≤ 50 chars |
| `email` | String | required, unique, lowercase, valid email |
| `password` | String | required, ≥ 6 chars, **bcrypt-hashed**, never returned (`select: false`) |
| `lockPassword` | String | optional, ≥ 4 chars, **bcrypt-hashed**, opens locked notes; never returned |
| `createdAt`, `updatedAt` | Date | automatic |

**Note**

| Field | Type | Rules |
|---|---|---|
| `user` | ObjectId → User | required, indexed — owner of the note |
| `title` | String | required, ≤ 120 chars |
| `content` | String | ≤ 20 000 chars |
| `tags` | [String] | ≤ 10, auto-normalised (lowercase, no `#`, no duplicates) |
| `pinned` | Boolean | default `false` |
| `locked` | Boolean | default `false` — needs the lock password to open |
| `editedAt` | Date | last time title/content/tags/colour changed (used for "edited" dates) |
| `color` | String | `default`, `yellow`, `green`, `blue`, `pink`, `purple` |
| `createdAt`, `updatedAt` | Date | automatic timestamps |

Indexes: `{ user, pinned, updatedAt }` and `{ user, tags }` for fast listing and tag filtering.

---

## 6. REST API

Base URL: `http://localhost:5000/api`. All bodies are JSON. Protected routes need the header
`Authorization: Bearer <token>`.

### Auth

| Method | Endpoint | Body | Response |
|---|---|---|---|
| POST | `/auth/register` | `{ name, email, password }` | `201 { token, user }` |
| POST | `/auth/login` | `{ email, password }` | `200 { token, user }` |
| GET | `/auth/me` 🔒 | – | `200 { user }` (includes `hasLockPassword`) |
| PUT | `/auth/lock-password` 🔒 | `{ newPassword, currentPassword? }` | `200 { user }` — set, or change (needs current) |

### Notes (all 🔒)

| Method | Endpoint | Description |
|---|---|---|
| **GET** | `/notes` | List the user's notes. Query: `search`, `tag`, `pinned=true/false`, `locked=true/false`, `sort=updated/created/oldest/title`. Pinned first. |
| **POST** | `/notes` | Create a note → `201 { note }` |
| **PUT** | `/notes/:id` | Update any fields → `200 { note }` |
| **DELETE** | `/notes/:id` | Delete → `200 { message, id }` |
| GET | `/notes/:id` | Get one note |
| PATCH | `/notes/:id/pin` | Toggle pinned |
| PATCH | `/notes/:id/lock` | Lock a note, or remove the lock (body `{ password }`) |
| POST | `/notes/:id/unlock` | Body `{ password }` → full content of a locked note |
| GET | `/notes/stats` | Totals (all / pinned / locked) + tag counts (aggregation) |

Locked notes: `PUT` and `DELETE` also need the header `X-Lock-Password: <lock password>`. A wrong lock password returns **403** (not 401, so the user stays logged in).

**Example – create a note**

```http
POST /api/notes
Authorization: Bearer eyJhbGciOi...
Content-Type: application/json

{
  "title": "DBMS revision",
  "content": "Normal forms: 1NF, 2NF, 3NF, BCNF",
  "tags": ["study", "exam"],
  "pinned": true,
  "color": "yellow"
}
```

```json
{
  "success": true,
  "note": {
    "id": "671c9f2e8b3a4c0012ab34cd",
    "user": "671c9e118b3a4c0012ab34c1",
    "title": "DBMS revision",
    "content": "Normal forms: 1NF, 2NF, 3NF, BCNF",
    "tags": ["study", "exam"],
    "pinned": true,
    "locked": false,
    "color": "yellow",
    "editedAt": "2026-10-14T09:12:30.512Z",
    "createdAt": "2026-10-14T09:12:30.512Z",
    "updatedAt": "2026-10-14T09:12:30.512Z"
  }
}
```

**Errors** always look like this:

```json
{ "success": false, "message": "Validation failed", "details": { "title": "Title is required" } }
```

| Status | When |
|---|---|
| 400 | Invalid body / validation error / malformed JSON |
| 401 | Missing, invalid or expired token; wrong password |
| 404 | Note doesn't exist **or belongs to another user** |
| 409 | Email already registered |
| 429 | Too many login attempts |

You can try every endpoint from VS Code with `server/requests.http` (install the *REST Client* extension).

---

## 7. Security measures

- Passwords hashed with bcrypt (10 salt rounds); never sent back to the client.
- JWT authentication with expiry; `protect` middleware on all note routes.
- Per-user data isolation on every query; ids of other users' notes return 404 (no information leak).
- Request bodies are **whitelisted** — a client cannot change the `user` field of a note.
- Search text is regex-escaped (prevents regex injection).
- Helmet security headers, CORS restricted to the client URL, 100 kb body limit, login rate limiting.
- The same error message for "unknown email" and "wrong password".
- Locked notes: content and tags are stripped from every response until the lock password is verified; lock attempts are rate limited; the password typed to open a note is only kept while that note is open.

---

## 8. Testing

```bash
npm test
```

Covers: registration, duplicate emails, validation errors, login success/failure, `/auth/me`, protected routes without/with bad token, create/list/search/tag filter, update, **cross-user isolation** (read/update/delete), pin toggle (not counted as an edit), stats, **locked notes** (lock password set/change, hidden content, title-only search, unlock with right/wrong password, protected edit/delete, removing the lock), delete, invalid ids and unknown routes.

---

## 9. Deployment (optional)

1. **Database:** create a free cluster on MongoDB Atlas and copy its connection string.
2. **API (Render / Railway):** root directory `server`, build `npm install`, start `npm start`; set `MONGO_URI`, `JWT_SECRET`, `CLIENT_URL=<your frontend URL>`.
3. **Frontend (Vercel / Netlify):** root directory `client`, build `npm run build`, output `dist`; set `VITE_API_URL=<your API URL>` (without `/api`). Add a rewrite of all routes to `/index.html`.

---

## 10. Development plan followed

| Day | Work |
|---|---|
| 1 | Features, MongoDB schemas, REST endpoint contract |
| 2 | Express server, DB connection, JSON APIs, auth |
| 3 | React pages, forms, Axios API layer |
| 4 | Complete CRUD flows, search/filter, validation, loading/error states |
| 5 | API tests, bug fixes, README, deployment notes |

## Screenshots

| Login | New note | Unlock a locked note | Mobile |
|---|---|---|---|
| ![Login](docs/screenshots/login.png) | ![Composer](docs/screenshots/composer.png) | ![Unlock](docs/screenshots/unlock.png) | ![Mobile](docs/screenshots/mobile.png) |
