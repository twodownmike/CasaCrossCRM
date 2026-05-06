# Casa Cross — CRM

A free, mobile-first CRM for Anna's styled photoshoot business.

- **Stack:** Next.js 14 (App Router) · TypeScript · Supabase (Postgres + Auth + Realtime)
- **Hosting:** Vercel (free Hobby tier) + Supabase (free tier)
- **Sign-in:** email magic link (no passwords)
- **Phone-first design** that scales to a desktop "phone-frame"

## What's inside

| Surface | Route | What it does |
| --- | --- | --- |
| Dashboard | `/home` | Today's eyebrow, outstanding/collected $, "needs attention", upcoming task list, next event hero, recent people row |
| Events | `/events` | Filterable list (All / Upcoming / Wrapped) |
| Event detail | `/events/[id]` | 6 tabs: Overview, Roster, Money, Tasks, Mood, Chat (realtime) |
| New / edit event | `/events/new`, `/events/[id]/edit` | Full form with cover, status, capacity, tags |
| Booking editor | `/events/[id]/participants/[pid]` | Update rate / paid / status / contract / due, mark fully paid, remove |
| People | `/people` | Searchable, filterable roster grouped by role |
| Person detail | `/people/[id]` | About / Events / Money / Notes |
| Calendar | `/calendar` | Month grid with event dots + "this month" list |
| Messages | `/messages` | Cross-event threads → opens chat tab on the event |
| Auth | `/login` | Magic-link sign-in. First sign-in is auto-added as a team member; everyone else has to be invited (see below). |

All authenticated team members share the same data — Anna and you both sign in with your own emails.

## One-time setup (free, ~10 min)

### 1. Create the Supabase project (free)

1. Go to https://supabase.com → New project → pick the **Free** plan.
2. Once it's ready, in the dashboard find **Project Settings → API** and copy:
   - `Project URL` → this is `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → this is `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 2. Run the migrations

In the Supabase dashboard, open **SQL Editor** and run, in order:

1. Paste the contents of `supabase/migrations/20260503000000_init.sql` and run it. This creates all tables, enums, RLS policies, the `team_members` whitelist, and the trigger that auto-promotes the very first signed-in user.
2. (Optional) Paste `supabase/migrations/20260503000001_seed.sql` to load Anna's starter data — the same studio roster the design used. Skip this if you want to start empty. ⚠️ Run this **after** at least one user has signed in, so the policies allow inserts.

### 3. Configure auth

In **Authentication → URL Configuration**:

- **Site URL:** `https://crm.casacross.org` — for local dev use `http://localhost:3000`
- **Redirect URLs:** add `https://crm.casacross.org/auth/callback`, `https://events.casacross.org/auth/callback`, and `http://localhost:3000/auth/callback`

Email magic links work out of the box on the free tier.

### 4. Deploy to Vercel (free)

1. Push this repo to GitHub.
2. Go to https://vercel.com → New Project → import the repo.
3. Set environment variables (Production + Preview + Development):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SITE_URL` (fallback URL, e.g. `https://crm.casacross.org`)
   - `NEXT_PUBLIC_CRM_URL` (`https://crm.casacross.org`)
   - `NEXT_PUBLIC_EVENTS_URL` (`https://events.casacross.org`)
4. Deploy.

### 5. Add Anna and you to the team

1. Visit your deployed URL, click "Email me a sign-in link", enter your email, click the link.
2. The trigger we installed promotes the **first** sign-in to the `team_members` whitelist. You're now in.
3. To add Anna (or anyone else), open Supabase → **SQL Editor** and run:

   ```sql
   insert into public.team_members (user_id, display_name)
   select id, 'Anna'
   from auth.users
   where email = 'anna@example.com';
   ```

   She'll need to have signed in once first (use the magic-link flow) so her user row exists in `auth.users`. After that one SQL insert, she has full access.

That's it. The CRM is live.

## Local development

```bash
cp .env.example .env.local
# fill in NEXT_PUBLIC_SUPABASE_URL / _ANON_KEY / SITE_URL=http://localhost:3000
npm install
npm run dev
```

Open http://localhost:3000 — you'll be redirected to `/login`. Sign in with the same email you set up the project with.

### Add to Anna's phone home screen (PWA)

On iPhone Safari: tap **Share → Add to Home Screen**. The manifest in `public/manifest.webmanifest` makes it open full-screen with the Casa Cross icon. (Add `public/icon-192.png` and `public/icon-512.png` of your branding if you want a custom icon — otherwise iOS uses a screenshot of the home page.)

## Schema at a glance

```
team_members (whitelist; only members can read/write everything)
people        ─┐ many-to-many ┌─ events
                participants (rate, paid, status, contract, due_date)
events ─── tasks
events ─── activity (timeline)
events ─── messages (per-event chat, realtime via Supabase channels)
people ─── notes
```

All public tables have RLS on, with policies that only admit `team_members`. The first sign-in is auto-added by the `bootstrap_first_member` trigger.

## Where the design came from

`design/casa-cross/` is the original Claude Design handoff bundle. The styling you see in `src/app/globals.css` is its `styles.css` verbatim, plus a small auth/form extension at the end. The React/JSX prototype was used as a structural reference but reimplemented in TypeScript / Next.js / Supabase, with real CRUD instead of in-memory data.
