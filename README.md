# Yet, We Can Heal

*One heart at a time.*

A quiet digital space for anonymous stories of survival and healing.

## Status: Phase 1-3 (Frontend + real backend)

The frontend is fully built, and the backend is now wired to a real Supabase
database -- submissions, moderation, admin roles, and metrics all persist for
real, not just as UI mockups.

### Pages included

- `/` -- Landing page (photographic hero, mission, story previews)
- `/check-in` -- Emotional check-in flow (logs real emotion-selection metrics)
- `/stories` -- Story feed with search bar + multi-select emotion filter, pulling live approved stories
- `/stories/[id]` -- Single story with trigger-warning gating, real read-count and "was this helpful?" tracking
- `/stories/submit` -- Anonymous submission form (real DB insert, always lands as "pending")
- `/community` -- Coming Soon + email waitlist (real signups)
- `/community-guidelines` -- Safety and moderation standards
- `/crisis-resources` -- Disclaimer + direct contact (email/WhatsApp placeholder)
- `/about` -- Mission, 7 team member placeholders (photo-upload preview -- not yet persisted, see below), founding story
- `/articles` + `/articles/[slug]` -- Reflection & coping articles, tagged by emotion
- `/volunteer` -- Volunteer application form (real DB insert, admin-only visibility)
- `/admin/login` -- **Real** Supabase Auth sign-in
- `/admin` -- Moderation dashboard: live pending queue, approve/reject, real metrics
- `/admin/team` -- Super Admin-only: invite/remove team members (Editor vs Super Admin)
- `/admin/activity-log` -- Full accountability trail: who approved/rejected/edited what, and when

**Route protection is real now too** -- `middleware.ts` blocks anyone without
a valid admin login from reaching `/admin/*`, and `/admin/team` specifically
requires the Super Admin role.

### Still not persisted / not yet built

- Team photo uploads on `/about` are a live browser preview only -- wiring
  these to Supabase Storage so they persist for everyone is a small follow-up
  (not done yet, to keep this phase focused on the moderation pipeline)
- No email notifications yet beyond Supabase's default invite email (e.g. no
  "your story was approved" email to submitters)

---

## Setting up Supabase (do this once)

1. **Create a project** at [supabase.com](https://supabase.com) (free tier is fine to start).
2. **Run the schema.** In your Supabase dashboard: SQL Editor -> New query ->
   paste the entire contents of `supabase/migrations/0001_init.sql` -> Run.
   Then do the same, one at a time, for the additional migrations in order:
   `0002_contact_messages.sql`, `0003_team_members.sql`, and
   `0004_team_photos_storage.sql`. Each is additive and safe to run once.

   **For team photo storage:** the reliable way to create the bucket is via the
   dashboard -- Storage -> New bucket -> name it exactly `team-photos` -> turn
   ON "Public bucket". Then run `0004_team_photos_storage.sql` for the upload
   policies. (The SQL tries to create the bucket too, but dashboard creation is
   more dependable.)

   **For invites/accept-invitation:** in Authentication -> URL Configuration,
   set the Site URL and add `<your-site>/auth/callback` as a Redirect URL
   (e.g. `http://localhost:3000/auth/callback` for local dev), or invite links
   will bounce to the homepage instead of the set-password page.
   This creates every table, security policy, and seed data (emotions + articles) in one go.
3. **Get your API keys.** Dashboard -> Settings -> API. You'll need:
   - Project URL
   - `anon` `public` key
   - `service_role` key (keep this one secret -- server-only, never in the browser)
4. **Set environment variables.** Copy `.env.local.example` to `.env.local` and fill in the three values above.
5. **Create your first Super Admin.** Since new team members are only ever
   added by an existing Super Admin (via `/admin/team`), the very first one
   has to be created manually:
   - Supabase Dashboard -> Authentication -> Users -> Add user (enter your email, set a password, or use "send invite")
   - Then in SQL Editor, run:
     ```sql
     insert into public.admin_profiles (id, email, role)
     values ('paste-the-user-id-from-the-users-table', 'you@yourdomain.com', 'super_admin');
     ```
   - You can now log in at `/admin/login` and add the rest of your team from the dashboard itself.

## Deploying (Vercel + Supabase)

1. Push this repo to GitHub (see below).
2. Import the repo into [Vercel](https://vercel.com/new).
3. In Vercel's project settings -> Environment Variables, add the same three
   variables from `.env.local`.
4. Deploy. Vercel handles the Next.js build automatically.

**One thing worth knowing:** Supabase's free tier pauses a project after 7
days of no activity. If the site goes quiet between now and launch, you may
need to manually "resume" it in the Supabase dashboard. A free scheduled
ping (e.g. a GitHub Action hitting your site's URL every few days) prevents
this if you want to set it up.

## Getting started locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Make sure `.env.local`
is set up first (see above) or the app will error trying to reach Supabase.

**If `npm install` fails or `npm run dev` says `'next' is not recognized`:**
`npm install` must complete successfully first -- that's what creates the
`node_modules` folder `next` lives in. See troubleshooting notes in the
project plan document if you hit network or permission errors.

## Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS
- Supabase (Postgres database, Auth, Row Level Security)
- Vercel (hosting)

## Pushing to GitHub

```bash
git init
git add .
git commit -m "Phase 1-3: frontend + Supabase backend"
git branch -M main
git remote add origin <your-repo-url>
git push -u origin main
```

**Before extracting a new copy of this project:** delete any previous
`yet-we-can-heal` folder and any `yet-we-can-heal*.zip` files from your
Downloads folder first, to avoid duplicate folders with `_1` suffixes.
