# Forge — Freelance Marketplace Frontend

React + Vite + Tailwind frontend for the Freelance Marketplace API
(`https://freelance-api-g8gh.onrender.com`), built directly against its
OpenAPI schema.

## Run it

```bash
npm install
npm run dev
```

The API base URL is read from `.env` (`VITE_API_URL`), already pointed at
the live deployment.

## What's fully wired to the real backend

- Auth: signup, OAuth2 password login, token storage, auto `Authorization`
  header, protected routes, logout, 401 auto-logout.
- Jobs: browse/search/paginate (`search`, `min_budget`, `max_budget`,
  `limit`, `offset`), create, edit, delete (owner-only).
- Applications: freelancers apply with a cover letter, rate, and timeline;
  clients view and accept/reject applications per job; freelancers see
  their own application statuses.
- Profile: view/edit bio & skills, portfolio file upload, reviews display.

## Known backend gaps (flagged rather than faked)

These aren't bugs in the frontend — they're places the API doesn't (yet)
expose what the UI would need:

1. **No `GET /jobs/{id}`.** Job Details uses the job data passed in from
   the list click; if someone lands on the URL directly (refresh, shared
   link), it falls back to paging through `GET /jobs/` client-side to find
   a match (`src/api/jobs.js#findJobById`). This works but doesn't scale —
   add a real detail endpoint when convenient.
2. **No public "get user by id."** `JobResponse` only has `owner_id`, so
   job cards/details show "Client #id" instead of a name or avatar. Same
   limitation applies to freelancer applications on the client dashboard.
3. **No chat/WebSocket route** — only a placeholder `GET /chat/test`
   exists. `src/pages/Messages.jsx` ships a ready UI shell but is
   explicitly marked as not connected, rather than inventing a socket
   protocol that doesn't exist.
4. **No `category`, `job_type`, `skills`, or `created_at` on jobs.** The
   filter bar only exposes what the backend actually supports (keyword
   search + budget range); it doesn't render fake category/type filters.

## Structure

```
src/
├── api/            # one module per resource, thin wrappers over axios
├── components/     # layout, ui primitives, jobs, applications, reviews
├── context/         # AuthContext, ToastContext
├── pages/           # route-level components
└── utils/            # formatting helpers
```
