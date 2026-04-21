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

## Included in this first build

- Splash screen concept: `TRACE`
- First-launch setup flow for Supabase URL and anon key
- Projects dashboard with search, category filters, and create/edit/delete
- Project view with stats, tag/status filters, decision timeline, and export actions
- Decision detail modal, editable decision form, and presentation mode
- Seeded demo content stored locally with Zustand persistence
- Supabase-ready configuration helpers and SQL setup guidance from the PRD
