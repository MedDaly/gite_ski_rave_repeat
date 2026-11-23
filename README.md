# Gîte Happens 🎉

Mini-site for our end-of-year week in Savoie (26/12/2026 → 03/01/2027): pitch, who's coming, and choosing the gîte together.
UI in French; full spec in [`docs/spec.md`](docs/spec.md) (read it first).

**🔗 Live site: https://meddaly.github.io/gite_ski_rave_repeat/**
Share that link + the group password in the group chat.

## How it works

- **Frontend:** static HTML/CSS/vanilla JS (ES modules), no build step, served by GitHub Pages from `main`.
- **Backend:** Supabase Postgres. The browser only calls RPC functions (`supabase/schema.sql`) that check
  the group password (or admin password) against bcrypt hashes. Tables are not directly accessible.
- `js/config.js` holds the Supabase URL + publishable key (public by design). **Never commit passwords or the secret key.**

## Everyday how-to (organizer)

| I want to… | Do this |
|---|---|
| Delete a gîte / comment / answer / person | Footer → 🔧 → admin password → 🗑️ buttons appear (Wishlist and Récap). |
| Change a password | Supabase → SQL Editor → paste `supabase/seed.example.sql`, replace the placeholders **in the editor**, Run, then delete the query from history. Everyone is logged out and must enter the new password. |
| Change a database function | Edit `supabase/schema.sql`, re-run the whole file in the SQL Editor (safe, keeps data). |
| Update the budget study | Edit the data arrays at the top of `js/pages/budget.js`. |
| Update the site | Merge a branch into `main`; GitHub Pages redeploys in ~1 min. |
| Database paused (free tier, after ~1 week idle) | Supabase dashboard → Restore project. No data lost. |

## Run locally

```sh
python3 -m http.server 8000
# real backend:  http://localhost:8000/
# demo data:     http://localhost:8000/?mock=1   (password "raclette", admin "admin"; ?mock=reset restores samples)
```

## Status

- [x] Phase 1: skeleton, theme, router, password gate, identity picker, mock API
- [x] Phase 2: Accueil, Formulaire, Récap, Wishlist
- [x] Phase 3: Supabase backend
- [x] Phase 4: admin mode, GitHub Pages
- [x] Budget page: static cost study (`#/budget`)
- [ ] Phase 5 (optional): polish, snow effect, WhatsApp link preview image
