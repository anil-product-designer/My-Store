# My-Store

Frontend foundation for **DDL // Design Decision Log**, a personal product for product designers to capture, store, present, and export design decisions across projects.

## Run locally

```bash
npm install
npm run dev
```

## Supabase env

For this Vite app, Supabase env vars live in:

`.env.local`

```bash
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
```

The helper files are:

- `src/lib/supabase-client.js`
- `src/lib/supabase-config.js`
- `src/lib/supabase-todos-example.js`

## Included in this build

- **Dynamic Splash Screen**: Brand concept `TRACE` with smooth transitions.
- **Persistent Storage**: Full Supabase integration for Projects and Decisions.
- **Offline Fallback**: Zustand persistence with localStorage for demo mode and optimistic updates.
- **Projects Dashboard**: Advanced search, category filters, and full CRUD operations.
- **Decision Timeline**: Visual before/after tracking, tag/status filters, and rationale documentation.
- **Presentation Mode**: Full-screen storytelling mode for walking through design choices.
- **PDF Export**: Print-ready styles for exporting decision logs.
- **Share Flows**: Read-only public share view logic implemented.
