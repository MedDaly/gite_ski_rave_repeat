# Gîte Happens 🎉

Mini-site for our end-of-year week in Savoie (26/12/2026 → 03/01/2027): pitch, who's coming, and choosing the gîte together.
UI in French; spec in [`docs/spec.md`](docs/spec.md) (read it first).

- **Stack:** static HTML/CSS/vanilla JS (ES modules), no build step. Backend: Supabase (phase 3).
- **Live URL (once GitHub Pages is on):** https://meddaly.github.io/gite_ski_rave_repeat/

## Run locally

```sh
python3 -m http.server 8000
# open http://localhost:8000/?mock=1
```

## Mock mode

Until Supabase is configured in `js/config.js`, the site runs on an in-memory mock with sample data
(also forced with `?mock=1`). Demo password: **`raclette`**.
Mock data is kept in localStorage; open `?mock=reset` to restore the sample data.

## Status

- [x] Phase 1: skeleton, theme, router, password gate, identity picker, mock API
- [x] Phase 2: Accueil, Formulaire, Récap, Wishlist (on mock data)
- [ ] Phase 3: Supabase backend (needs the organizer to create the project)
- [ ] Phase 4: admin mode + GitHub Pages
