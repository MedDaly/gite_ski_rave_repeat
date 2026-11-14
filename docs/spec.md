# Spec: Group Trip Website ("gîte ski rave")

> Status: **Draft v0.1**. Product sections marked **[TBD]** need answers from the trip organizer before anyone builds them.
> Purpose: this is the single source of truth. Any new coding session should read this file first, then work through the implementation plan in section 3.

---

## 1. Context

A group of friends is organizing an end-of-year trip (*programme fin d'année*): a ski stay in a rented gîte, with a party/rave night. Right now the information is scattered across group chats. We want one simple website that everyone can open on their phone to see what's happening and what they need to do.

**Organizer:** the repo owner, who works from a phone through Claude Code cloud sessions.
**Audience:** friends in the group, almost all on mobile, not technical.

---

## 2. Product spec

### 2.1 Goals
1. **One link** with everything about the trip: when, where, how to get there, what to bring, the schedule.
2. **Less back-and-forth** in the group chat ("what's the address?", "who's driving?", "how much do I owe?").
3. **Easy to update** by the organizer from a phone, by asking a Claude session.

### 2.2 Non-goals (v1)
- No user accounts or passwords.
- No online payments. We track who owes what, but money moves outside the site (Lydia, PayPal, bank transfer, etc.).
- No native app. It's a mobile-first website only.

### 2.3 Users
| User | Needs |
|---|---|
| **Participant** | Check the dates, address, schedule and packing list; say if they're coming; see what they owe. |
| **Organizer** | Publish and update the info quickly; see who's confirmed; follow costs. |

### 2.4 Features

Priority: **P0** = must have in v1, **P1** = nice to have, **P2** = later or maybe.

| # | Feature | Description | Priority |
|---|---|---|---|
| F1 | **Home / overview** | Trip name, dates, countdown, location, short pitch, key links. | P0 |
| F2 | **Practical info** | Gîte address plus a map link, check-in/out times, house rules, wifi, emergency contacts. | P0 |
| F3 | **Getting there** | Train and car options, meeting points, travel times. | P0 |
| F4 | **Schedule (programme)** | Day-by-day plan: arrival, ski days, rave night, departure. | P0 |
| F5 | **Packing list** | Ski gear, rave outfit, shared items (who brings the speaker, food, etc.). | P0 |
| F6 | **Participants & RSVP** | List of who's coming and their status (confirmed / maybe / no). | P0 (read-only), P1 (self-service RSVP) |
| F7 | **Rooms / beds** | Who sleeps where. | P1 |
| F8 | **Carpool** | Drivers, seats, passengers. | P1 |
| F9 | **Budget & cost split** | Total cost (gîte, ski pass, food, rave) and the amount per person; who has paid. | P1 |
| F10 | **Ski info** | Resort, ski pass prices, equipment rental, slope map link, snow forecast link. | P1 |
| F11 | **Rave night** | Theme, dress code, playlist link (Spotify/Deezer), DJ line-up. | P1 |
| F12 | **Photo sharing** | Link to a shared album (Google Photos, iCloud). | P2 |
| F13 | **FAQ** | Common questions. | P2 |

### 2.5 UX principles
- **Mobile first.** It must look good on a phone, with large tap targets.
- **One page with sections** (anchor nav) for v1, rather than many pages. It's quicker to scan.
- **Language:** [TBD] French, English or both. The default assumption is French.
- **Look:** fun, winter/night vibe (snow plus neon), light and dark mode.
- **Privacy:** the address, phone numbers and names are semi-private. The site should not be indexed by search engines (`noindex`), and the URL is shared only in the group. [TBD] Is that enough, or do we need a shared password?

### 2.6 Trip data **[TBD — organizer to fill]**
| Field | Value |
|---|---|
| Trip name | [TBD] |
| Dates | [TBD] (around New Year?) |
| Gîte name / link / address | [TBD] |
| Ski resort | [TBD] |
| Number of people | [TBD] |
| Participant names | [TBD] |
| Budget / costs known so far | [TBD] |
| Rave night date & theme | [TBD] |
| Language(s) | [TBD] |

### 2.7 Open questions
1. Should participants **edit** anything themselves (RSVP, paid status, carpool seats), or does only the organizer update the info? This decides the tech choice in 3.3.
2. Is password protection required, or is an unlisted link enough?
3. Is a custom domain wanted, or is the free `github.io` URL fine?

---

## 3. Tech spec

### 3.1 Working environment
- **Coding:** the organizer works from a phone through **Claude Code cloud sessions** (claude.ai/code or the Claude app). Each session runs in a cloud Linux container with the repo cloned, and can write code, run it, test it in a headless browser (Playwright/Chromium) and take screenshots.
- **Source of truth:** the GitHub repo `meddaly/gite_ski_rave_repeat`.
  - `main` is the live site.
  - Sessions work on their own branch and open a PR. The organizer merges from the phone (GitHub app or web).
- **Nothing is installed locally.** Containers are temporary, so every piece of work must be **committed and pushed** before a session ends.
- **Hosting:** **GitHub Pages**, which is free and serves from `main`. Every merge to `main` updates the live site in about a minute.

### 3.2 Stack (v1)
Keep it as simple as possible so any session can pick it up quickly:
- **Plain static site:** `index.html` plus `styles.css` plus a little vanilla `app.js`.
- **No build step, no framework, no npm dependencies.** GitHub Pages serves the files as they are.
- **Content lives in one data file,** `data/trip.json` (dates, schedule, packing list, participants, costs). `app.js` renders the sections from it. Updating the trip then means editing JSON, not HTML.
- External links (map, playlist, album) open in new tabs. No third-party scripts unless a feature needs one.
- `<meta name="robots" content="noindex">` on every page.

### 3.3 Interactive features (P1, decided by open question 1)
If participants need to edit things themselves (RSVP, paid, carpool):
- **Option A (simplest):** embed a **Google Form**, with answers going into a Google Sheet, and link to that sheet or publish a read-only view of it. No code to maintain.
- **Option B:** a small backend such as **Supabase** (free tier) called from `app.js`. More work, and it needs keys and config.
- **Option C:** a **Claude Artifact** page with a shared database for the interactive parts, linked from the main site.

**Recommendation:** start with static content (organizer-edited JSON). Add Option A only if the group chat proves it's needed.

### 3.4 Planned repo structure
```
/
├── index.html          # single page, sections F1–F11
├── styles.css
├── app.js              # loads data/trip.json and renders the sections
├── data/
│   └── trip.json       # ALL trip content lives here
├── assets/             # images, icons
├── docs/
│   └── spec.md         # this file
└── README.md           # short: what it is, live URL, how to update
```

### 3.5 Quality checks (each session, before pushing)
- Open `index.html` in headless Chromium at phone width (390px) and desktop width. Check there's no horizontal scroll and no console errors.
- Check that `trip.json` is valid JSON.
- Check light and dark mode.
- Attach a phone-width screenshot to the PR.

---

## 4. Implementation plan

Each phase can be one session and one PR.

| Phase | Scope | Done when |
|---|---|---|
| **0. Spec** | This document. | Organizer has filled section 2.6 and answered 2.7. |
| **1. Skeleton & deploy** | Repo structure (3.4), empty `index.html` with nav and sections, `styles.css` theme, GitHub Pages turned on (*Settings → Pages → Deploy from branch → `main` / root*). | Live URL shows a placeholder page on a phone. |
| **2. Core content (P0)** | `trip.json` schema plus rendering for F1–F6 (F6 read-only). Fill in real data from 2.6. | Friends can get every key piece of info from the link. |
| **3. Nice-to-haves (P1)** | F7–F11, with costs shown per person. | Organizer is happy with it; link shared in the group. |
| **4. Interactivity (optional)** | RSVP/paid/carpool following 3.3. | Participants can update their own status. |
| **5. Polish** | FAQ, photos link, small animations, final review. | Before departure. |

### Notes for the next session
- Read this spec first. If section 2.6 still has [TBD] values, **ask the organizer** for them rather than inventing data. Use obvious placeholders if you need to keep going.
- Don't add frameworks or build tooling without updating section 3.2 first.
- Keep this spec up to date: when a decision is made, record it here in the same PR.
