# Dragio (React)

React + Vite rewrite of the original vanilla HTML/CSS/JS Dragio app. Same
Supabase backend, same design, same features — different frontend
architecture.

## Status: core loop migrated, rest in progress

This is being migrated incrementally, the same way the original app was
built. **Don't treat this as a finished replacement yet.**

### Fully rebuilt in React
- Onboarding (4-step: welcome, how-it-works, interests, signup)
- Sign in / forgot password / reset password
- Home feed (all 5 tabs, realtime new-debate insertion on Latest)
- Debate detail (comments, replies, sorting, mind-changed, reply-with-debate,
  live vote/count updates)
- Create debate (dynamic 2–6 options, image upload, collaboration invite)
- Persistent app shell: Header + BottomNav never remount between pages
  (React Router `<Outlet />` pattern) — navigation is instant, no full reload

### Not yet migrated (routes exist, show a placeholder screen)
Search, Category browse, Profile (own + others), Edit Profile, Followers/
Following list, Notifications, Business Dashboard, Admin, Messages inbox,
Chat, Chat Settings. These all still work in the original vanilla app if you
need them right now — this React rewrite is additive, not a replacement,
until it's fully done.

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

**I cannot run `npm install` or a build in the environment that wrote this
code — it has no network access.** I've written the source carefully, but
haven't been able to test-compile it. Netlify's build servers (which do have
network access) will run the actual build when you deploy. If something
doesn't compile, paste me the exact build log and I'll fix it — same as
we've done with Termux errors throughout this project.

To test locally first (recommended before deploying blind):
```bash
npm install
npm run dev
```
Or in Termux, if you want to test on your phone before deploying:
```bash
pkg install nodejs
npm install
npm run dev
```

To deploy: connect this repo to Netlify (or push to the existing one) —
`netlify.toml` already specifies `npm run build` / publish `dist`, so no
manual configuration needed.
