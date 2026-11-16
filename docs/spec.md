# Spec: « Gîte Happens » 🎉

> Status: **v1.0. Product spec validated with the organizer** (Q&A session, Nov 2026).
> Purpose: this is the single source of truth. Any new coding session should read this file first, then follow the implementation plan in section 4.
> The site UI is in **French**. This spec is in English.

---

## 1. Context

A group of friends (5 to 15 people, not settled yet) is organizing an end-of-year week in Savoie:

- **When:** Saturday **26 December 2026** to Sunday **3 January 2027**.
- **Where:** somewhere in the **Alps** (first ideas were around Chambéry / Aix-les-Bains / Aillons-Margériaz, but the group now looks more widely).
- **What:** rent a gîte for the week, celebrate **New Year's Eve (Réveillon)** together, ski for those who want to, and **remote-work (télétravail)** for those who need to.
- **Status:** **no gîte has been chosen yet.** The group picks one from a wishlist (main source: Gîtes de France).

**The website's job:** pitch the idea, share it with **one link**, **collect who's interested** and their preferences, and **choose the gîte together**.

**Organizer / admin:** the repo owner, who works from a phone through Claude Code cloud sessions.
**Audience:** friends, almost all on mobile, not technical.
**Deadline:** as soon as possible. The gîte has to be booked soon for 26 December.

---

## 2. Product spec

### 2.1 Goals
1. **Pitch** the trip in a fun way so people want to join.
2. **Collect interest:** who's in, on which days, and with what preferences.
3. **Choose the gîte** together: anyone can suggest options, vote and comment.
4. **Show a group summary** so everyone can see who's coming and what the group prefers.

### 2.2 Non-goals (v1)
- Programme/schedule page, budget or cost split, FAQ, packing list. These may come in v2.
- Real accounts or strong security. This is a small friends' app, so we keep things relaxed.
- Payments or booking through the site.
- Custom domain. The free URL is fine.

### 2.3 Access & identity
- **One shared password** for the whole site. Everyone uses the same one. The password screen comes first, and the session is remembered on the device.
- After the password, the user **picks who they are**:
  - **pick an existing name** from the list, or
  - **add their name**, or
  - **continue as "Invité" (Guest).** Guest is a single shared default identity for people who are just exploring.
- The user can **switch identity** at any time from the header. The form page also has a "switch from Guest to my name" prompt.
- The current identity is stored on the device (localStorage). There is no real login.

### 2.4 Permissions

| Action | Invité (Guest) | Named user | Admin |
|---|---|---|---|
| View all pages, the summary and all answers | ✅ | ✅ | ✅ |
| Fill in or edit the form | ❌ (can view it, and is prompted to pick a name) | ✅ (own answers only, can edit any time) | ✅ |
| Add a gîte option | ✅ | ✅ | ✅ |
| Vote 👍 on a gîte | ✅ (one shared Guest vote per gîte) | ✅ (one per gîte, can remove it) | ✅ |
| Comment on a gîte | ✅ | ✅ | ✅ |
| Delete anything (gîte, comment, participant, answers) | ❌ | ❌ | ✅ |

- **Users can add things but cannot delete them.** Only the admin can clean up.
- **Admin mode:** unlocked with a separate **admin password**, entered in a hidden or low-key spot such as the footer. It shows 🗑️ delete buttons everywhere.

### 2.5 Pages (v1 = 4 pages)
The site is mobile-first, with a bottom tab bar or sticky top nav linking the four pages.

#### P1. Accueil (Home): the pitch
- Trip name **Gîte Happens**, dates, a countdown to 26/12, and a generic location ("somewhere in the Alps, to be decided together").
- A **funny pitch** in French: a week in Savoie mixing lake, mountains, raclette, ski, remote work with a view, and a big Réveillon. Tone: humorous and self-mocking. Nods to *Les Bronzés font du ski* are welcome.
- Short "the concept" section: you come for as long as you like during the week, ski or not, remote-work or not, and everyone's there for New Year's Eve.
- Live mini-stats pulled from the data, for example "8 in · 3 maybe · 5 gîtes on the wishlist".
- Main buttons: **"Je suis chaud·e → Formulaire"** and **"Voir les gîtes → Wishlist"**.

#### P2. Formulaire (Form): my interest & preferences
One form per named person, which they can edit at any time (it's pre-filled when they come back). **Every question is optional.** Each preference question has a **"Peu importe / tout me va"** (doesn't matter / all works for me) option.

| # | Question (FR label) | Type | Options |
|---|---|---|---|
| Q1 | **Tu viens ?** | single choice | **Partant (In) / Peut-être (Maybe) / Pas dispo (Out)** |
| Q2 | **Tes dispos** | multi-select of days, plus a "Toute la semaine / tout me va" shortcut | Sat 26/12, Sun 27/12, Mon 28/12, Tue 29/12, Wed 30/12, Thu 31/12 🎆, Fri 01/01, Sat 02/01, Sun 03/01 |
| Q2b | Notes sur les dates | free text | e.g. "arrive Sunday evening" |
| Q3 | **Ski ?** | single choice | Oui / Non / Peu importe |
| Q4 | **Télétravail ?** | single choice | Oui / Non / Peu importe |
| Q5 | **Où loger ?** | single choice | Chambéry / Aix-les-Bains / En pleine nature / Peu importe |
| Q6 | **Louer une voiture ?** | single choice | Oui / Non / Peu importe |
| Q7 | Un mot ? | free text (optional) | general notes |

- If the identity is **Invité**, the form is shown read-only (or blurred), with a banner: "Choisis ton prénom pour répondre" (pick your name to answer) and a name picker.
- Saving shows a clear "✅ Enregistré" (saved) confirmation and a link to the summary.

#### P3. Récap (Summary): everyone's answers
Visible to everyone, Guest included.
- **Headcount:** In / Maybe / Out, with names.
- **Day-by-day attendance grid:** rows are people, columns are 26/12 to 03/01, and the bottom row shows the total per day. It must scroll horizontally *inside its own container* on mobile, never the whole page. Highlight 31/12.
- **Preference breakdown** for ski, remote work, where to stay and car rental: counts or simple bars, with "peu importe" shown separately.
- **List of people's answers** (one card per person, including their notes and comments).

#### P4. Wishlist: the gîtes
- **List of gîte cards, sorted by votes** (highest first), then by date added.
- **Card contents:** name, **link** (opens the listing in a new tab), optional photo (image URL), optional price, optional capacity, optional area (free text, e.g. a town or region), short description, "added by <name>".
  - *Note:* Gîtes de France and similar sites block being embedded in an iframe, so we **don't embed the page**. The card plus the link is the "embed".
- **👍 vote button** with a count and the voters' names. Tap again to remove your own vote.
- **Comments section** on each card: an expandable thread showing author, text and time.
- **"+ Ajouter un gîte" form:** URL (required), name (required), and photo URL, price, capacity, area and description (all optional).
- A helper link to Gîtes de France (searching widely: Savoie, Haute-Savoie, Isère…).

### 2.6 UX & design
- **Mobile-first.** Design for a 375–390px width first, with large tap targets (≥ 44px) and no horizontal page scroll.
- **Look:** fun "snow plus New Year's Eve" vibe (snowy mountains plus party/neon touches), with light and dark mode.
- **Language:** everything user-facing is in **French**.
- **Privacy:** add `<meta name="robots" content="noindex">`. The link is shared only in the group, and the password protects the content.
- **Feedback:** loading states, error messages in French, and an optimistic update for votes.

### 2.7 Decisions log
| Topic | Decision |
|---|---|
| Name | **Gîte Happens** |
| Language | French |
| Access | One shared password, plus pick/add a name or Guest |
| Guest | Can view everything, vote and add gîtes or comments; cannot submit the form |
| Deleting | Admin only; users can only add (and edit their own form answers) |
| Form | Every question optional, each with a "peu importe" choice; status In/Maybe/Out |
| Answers visibility | Everyone sees everyone's answers plus a summary |
| Gîte embed | Card plus external link (no iframe) |
| v1 scope | 4 pages: Accueil, Formulaire, Récap, Wishlist |
| Domain | Free URL (GitHub Pages) |
| Deadline | As soon as possible |
| Mock mode | `js/mock-api.js` is used with `?mock=1` **or while `SUPABASE_URL` is empty**. Mock password `raclette` (demo only, not a real password). Mock data persists in localStorage; `?mock=reset` restores samples. |
| Single-choice answers | Tap a selected chip again to clear it (every question is optional). |
| Supabase client | **Plain `fetch` to PostgREST** (`/rest/v1/rpc/<fn>`) in `js/api-supabase.js` instead of `supabase-js`: we only call RPCs, so no SDK/CDN dependency is needed. Works with a legacy anon key or a new `sb_publishable_` key. |
| RPC errors | Functions raise `code` or `code: detail` (`bad_password`, `invalid`, `reserved_name`, `not_found`); the frontend maps them to French messages. Admin RPCs (`admin_check`, `admin_delete`) already exist in `schema.sql` for phase 4. |
| Admin mode | Discreet 🔧 in the footer → admin password (kept in localStorage, `gh_admin_pw`). Shows 🗑️ on gîtes, comments (Wishlist), answers and people (Récap). Votes aren't individually deletable in the UI (the RPC supports it). Mock admin password: `admin`. |
| Gîte areas | **Free text** (≤ 60 chars), e.g. "Annecy", "Les Bauges". Old values `chambery`/`aix`/`nature`/`autre` still display with their labels. |
| Location scope | Not limited to Chambéry / Aix-les-Bains / Aillons-Margériaz: the group looks more widely in the Alps. Home page wording is generic. |

---

## 3. Tech spec

### 3.1 Working environment
- **Coding:** the organizer works from a phone through **Claude Code cloud sessions** (claude.ai/code or the Claude app). Each session has a cloud Linux container with the repo cloned, and can write code, run it, test it with headless Chromium/Playwright and take screenshots.
- **Source of truth:** the GitHub repo `meddaly/gite_ski_rave_repeat`.
  - `main` is the live site.
  - Each session works on its own branch, pushes, and opens a PR when the organizer asks. The organizer merges from the phone.
- **Containers are temporary,** so always **commit and push** before a session ends.

### 3.2 Architecture (decided)

```
 Phone browser
     │
     ▼
 GitHub Pages  ── static HTML/CSS/JS (this repo, branch main)
     │  supabase-js (CDN), anon key
     ▼
 Supabase (free tier) ── Postgres + RPC functions (password checked server-side)
```

- **Frontend:** **GitHub Pages**, a static site served from `main`. Free URL: `https://meddaly.github.io/gite_ski_rave_repeat/`. The repo could be renamed `gite-happens` later to get a nicer URL.
  - Plain **HTML + CSS + vanilla JS (ES modules)**. **No build step, no npm, no framework.**
  - `supabase-js` loaded from a CDN with an **exact pinned version** (jsDelivr).
  - Hash-based routing (`#/accueil`, `#/formulaire`, `#/recap`, `#/wishlist`) in a single `index.html`, so there are no GitHub Pages 404 problems.
- **Backend:** **Supabase** free project (Postgres).
  - **Why:** the site needs shared, persistent data (answers, gîtes, votes, comments) that every friend reads and writes. GitHub Pages alone can't store anything. Supabase is free, needs no server to maintain, and works from a static site. Friends don't need any account.
  - **Why not a Claude Artifact:** it's less portable, the code wouldn't live in the repo, and viewers outside Claude may not get a smooth experience.

### 3.3 Security model (simple, but not purely client-side)
- **Row Level Security is on for all tables, with no direct table access for `anon`.**
- All reads and writes go through **Postgres RPC functions** (`security definer`) that take the **group password** as a parameter and check it against a hashed value in a `settings` table. Admin functions check the **admin password** the same way.
- The frontend stores the password in localStorage after a successful check, and sends it with each RPC call.
- **The Supabase URL and anon key are public by design** and go into `config.js` in the repo. **The passwords must never be committed.** The organizer sets them directly in Supabase. See the setup SQL in `supabase/`, which uses placeholders.
- Inputs are validated server-side (length limits, allowed enum values) and escaped when rendered (no `innerHTML` with user data).

### 3.4 Data model (Postgres)

```
settings      (key text pk, value text)                  -- 'group_pw_hash', 'admin_pw_hash'
participants  (id uuid pk, name text unique not null, created_at timestamptz)
responses     (participant_id uuid pk → participants, 
               status text check in ('in','maybe','out') null,
               days date[] null,            -- subset of 2026-12-26 … 2027-01-03
               all_days bool default false, -- "toute la semaine / tout me va"
               dates_note text null,
               ski text check in ('oui','non','peu_importe') null,
               teletravail text check in ('oui','non','peu_importe') null,
               lieu text check in ('chambery','aix','nature','peu_importe') null,
               voiture text check in ('oui','non','peu_importe') null,
               note text null,
               updated_at timestamptz)
gites         (id uuid pk, name text not null, url text not null, photo_url text, 
               price text, capacity int, area text, description text,
               added_by text not null, created_at timestamptz)
votes         (gite_id uuid → gites on delete cascade, voter text not null,
               created_at timestamptz, primary key (gite_id, voter))
comments      (id uuid pk, gite_id uuid → gites on delete cascade, author text not null,
               body text not null, created_at timestamptz)
```
- `voter` and `author` hold either a participant name or `"Invité"`.
- The reserved name **"Invité"** can't be used as a participant name, and the form RPC refuses it.

**RPC functions (sketch):**
- `check_password(pw)` returns a bool.
- `get_all(pw)` returns participants, responses, gîtes, votes and comments in one call (the data is tiny).
- `add_participant(pw, name)`
- `upsert_response(pw, name, …fields)`
- `add_gite(pw, …)`, `toggle_vote(pw, gite_id, voter)`, `add_comment(pw, gite_id, author, body)`
- `admin_delete(admin_pw, table, id)` (or one function per table)

### 3.5 Repo structure

```
/
├── index.html            # shell: header (identity switcher), nav, <main id="app">
├── css/styles.css        # tokens, light/dark, mobile-first
├── js/
│   ├── config.js         # SUPABASE_URL, SUPABASE_ANON_KEY (public), trip constants (dates, days list)
│   ├── api.js            # RPC wrappers
│   ├── state.js          # password + identity in localStorage
│   ├── router.js         # hash router
│   └── pages/
│       ├── accueil.js
│       ├── formulaire.js
│       ├── recap.js
│       └── wishlist.js
├── assets/               # images, favicon
├── supabase/
│   ├── schema.sql        # tables + RLS + RPC functions
│   └── seed.example.sql  # how to set password hashes (placeholders only)
├── docs/spec.md          # this file
└── README.md             # what it is, live URL, how to set up and update
```

### 3.6 Setup steps that need the organizer (one time, from the phone)
1. **Create a free Supabase project** at supabase.com, and send the session the **project URL** and **anon (public) key**.
2. In Supabase, **SQL Editor**, paste and run `supabase/schema.sql`, then set the two passwords with the snippet from `seed.example.sql`. The passwords stay in Supabase and are never shared in chat or the repo.
3. **Turn on GitHub Pages:** repo Settings, Pages, Deploy from branch, `main` / root.
4. The cloud session may need **network access to `*.supabase.co`** (the exact project host) to test against the real backend. The session can request this through the environment settings.

### 3.7 Quality checks (every session, before pushing)
- Open the site in headless Chromium at **390px** and **1280px** width. Check there's no horizontal page scroll and no console errors, and check both light and dark mode.
- Test the main flows: password, pick/add a name, fill in the form, see it in the summary, add a gîte, vote, comment, and Guest restrictions on the form.
- For frontend-only work without a backend, use a **mock `api.js`** (in-memory) that a `?mock=1` URL flag switches on, so the UI can be tested offline.
- Attach phone-width screenshots to the PR.

---

## 4. Implementation plan

Each phase is about one session and one PR.

| Phase | Scope | Done when |
|---|---|---|
| **0. Spec** ✅ | This document. | Done. |
| **1. Skeleton + mock** ✅ | Repo structure, `index.html` shell, theme (light/dark), hash router, nav, password screen, identity picker (name/add/Invité), **mock API** with sample data. | All 4 pages are reachable on a phone with mock data. |
| **2. Pages UI** ✅ | Accueil (funny pitch in French, countdown, stats), Formulaire (all questions, edit mode, Guest lock), Récap (headcount, day grid, preference breakdown, answers list), Wishlist (cards, vote, comments, add form). | Every flow works on mock data at 390px. |
| **3. Supabase backend** ✅ | `schema.sql` (tables, RLS, RPCs), real `api.js`, organizer setup (3.6 steps 1–2). | Data is shared between two different phones. |
| **4. Admin + deploy** ✅ | Admin mode (delete buttons), GitHub Pages turned on, README with the live URL and how-to. | Link shared in the group chat 🎉 |
| **5. Polish (optional)** | Animations, snow effect, OG image for link previews in WhatsApp, small fixes from friends' feedback. | Organizer happy. |

### Notes for the next session
- **Phase 3 contract:** pages only use `js/api.js` (`checkPassword`, `getAll`, `addParticipant`, `upsertResponse`, `addGite`, `toggleVote`, `addComment`). Implement the same functions in `js/api-supabase.js` (currently a stub), each taking the group password as first argument, mirroring the validation in `js/mock-api.js`. Throw `ApiError('bad_password')` on a wrong password so the app returns to the gate.
- **Read this spec first.** Don't change product decisions (2.7) without asking the organizer.
- UI copy is in **French** and funny. Code, comments and this doc are in English.
- No frameworks or build tooling. If you think one is needed, update 3.2 first and ask.
- Never commit passwords. The Supabase URL and anon key are OK.
- Keep this spec up to date: record new decisions in 2.7 in the same PR.
