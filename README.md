# Dragio (React)

React + Vite rewrite of the original vanilla HTML/CSS/JS Dragio app. Same
Supabase backend, same design, same features — different frontend
architecture.

## Status: all 18 pages migrated, verified live

Every page from the vanilla app now has a React equivalent, and the
build has been confirmed working through real deployment and live testing
(not just static checks) — a trigger-depth regression in the Supabase
security fixes and a PWA manifest/service-worker bug were both found and
fixed this way, not by guessing.

### Fully rebuilt in React
- Onboarding (4-step), Sign in / Forgot / Reset password
- Home feed (all 5 tabs, realtime new-debate insertion on Latest)
- Debate detail (comments, replies, sorting, mind-changed, reply-with-debate,
  live vote/count updates)
- Create debate (dynamic 2–6 options, image upload, collaboration invite)
- Search (debates/users/categories), Category browse
- Profile (own + others), Edit Profile (preset avatar picker), Followers/
  Following list
- Notifications (inline accept/decline for friend requests + collab invites)
- Messages inbox, Chat (edit/delete/copy, typing indicator, online presence,
  read receipts), Chat Settings
- Business Dashboard (create page, analytics, pending sponsored campaigns),
  Admin (reports, verification, user bans, categories, businesses, stats)
- Push notification registration (`usePushNotifications`) — no-op until a
  real VAPID public key is set in that file, same setup step the vanilla
  app needed
- Persistent app shell: Header + BottomNav never remount between pages
  (React Router `<Outlet />` pattern) — navigation is instant, no full reload

## Architecture

```
src/
├── main.jsx              # entry point, wraps app in providers
├── App.jsx                # route definitions
├── components/            # reusable UI: DebateCard, CommentCard, FollowPill,
│                           # BottomNav, Header, Modal, ErrorBoundary, etc.
├── pages/                 # one component per route
├── layouts/                # AppLayout (persistent shell) / AuthLayout
├── hooks/                  # useAuth, useFeed, useComments, useDebateRealtime,
│                           # useFollow, useBookmark, useConfirm, etc.
├── context/                # AuthContext, ToastContext
├── services/                # supabaseClient.js
├── utils/                   # formatters (timeAgo, friendlyAuthError, etc.)
└── styles/                  # global.css (ported verbatim) + page-specific.css
                              # (consolidated from what were per-page <style>
                              # blocks in the old HTML files)
```

### Design decisions worth knowing about

- **No manual `escapeHtml` calls anywhere** — JSX escapes all rendered
  content by default. This closes an entire class of XSS risk that had to
  be manually managed line-by-line in the vanilla version.
- **Realtime is self-contained per component**, not page-managed. Each
  `DebateCard` subscribes to its own Supabase channel scoped to its own
  `debate_id` (`useDebateRealtime`), instead of the old pattern of one
  page-level subscription doing `document.querySelector('[data-debate-id=...]')`
  to find and mutate the right DOM node. Cleaner, and avoids an entire class
  of "find the right element" bugs.
- **`AppLayout` handles the auth gate**, not individual pages — there's no
  more `requireAuth()` boilerplate at the top of every page; the layout
  redirects to `/signin` if there's no session, and every page under it can
  assume `useAuth()` returns a real user.
- **Vite fingerprints build output filenames** (e.g. `index-a1b2c3.js`), so
  the aggressive `immutable` caching in `netlify.toml` is actually safe here
  — a content change gets a new filename automatically. This is the opposite
  of the old static site, where hand-written unhashed filenames + immutable
  caching caused a real bug (documented in that repo) where code updates
  were invisible to returning visitors.

## Setup

The build has been confirmed working through real Netlify deployment — this
is no longer a "haven't tested it" caveat. If a future change ever breaks
the build, paste the exact Netlify build log and it gets fixed the same way
the trigger-depth and PWA bugs did: from real error output, not guessing.

To test locally:
```bash
npm install
npm run dev
```
Or in Termux:
```bash
pkg install nodejs
npm install
npm run dev
```

To deploy: connect this repo to Netlify — `netlify.toml` already specifies
`npm run build` / publish `dist`.
