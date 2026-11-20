# Coy · Discover tab

A swipe-based Discover tab (plus a Matches view) built as a standalone Next.js app. The Home tab is intentionally blank.

## Run it

```bash
npm install
npm run dev          # http://localhost:3000
npm run test:api     # in another terminal, against the running server
```

Data lives in `data/db.json` (auto-created and seeded on first request, git-ignored).
`POST /api/reset` restores the seed — the empty state has a "Reset demo data" button for demos.

## API

| Route | Behaviour |
|---|---|
| `GET /feed` | Profiles not yet swiped on, in a fixed shuffled order. Public fields only. |
| `POST /swipe` `{ profileId, action: "like" \| "pass" }` | Records the swipe. Returns `{ match: false }` or `{ match: true, profile }`. `400` bad input, `404` unknown profile, `409` already swiped. |
| `GET /matches` | Mutual matches, newest first. |

(`/feed`, `/swipe`, `/matches` are rewrites of `/api/*`.)

## How the privacy promise is enforced

- **`likesMe` never leaves the server.** Profiles are serialised through a whitelist (`toPublic` in `lib/db.js`), so a new private field can't leak by accident.
- **A match is decided server-side only.** The client learns `match: true/false` for the profile it just liked, nothing else. Liking someone who hasn't liked you looks the same as passing.
- **Nothing hints at who liked you.** Ids are opaque and the feed order is shuffled once at seed time, so position and id patterns reveal nothing.
- **"Never shown again" is a server rule.** Swipes are stored by profile id; `/feed` filters them out and a repeat `/swipe` returns `409`.

## Design notes and trade-offs

- Drag uses plain Pointer Events (no animation library): rotation and LIKE/PASS stamps follow the drag, then the card flies off. Buttons and ←/→ keys do the same on desktop.
- Cards are removed only after the server confirms the swipe; on failure the card springs back with a message.
- JSON file storage keeps setup to zero. Writes are atomic (temp file + rename). It is single-process only; swap `lib/db.js` for SQLite/Postgres to scale. Read-modify-write is safe here because each handler is synchronous.
- Single hard-coded user, as the brief allows.
