# Coding Club

Static React/Vite frontend. Deploys to GitHub Pages at a root domain or repository subpath. Supabase provides authentication and shared data. Without Supabase settings, the app runs a clearly labeled **local preview**: changes stay in that browser and are not shared with other members.

[Live site](https://sherthecoder.github.io/coding-club/) · [Repository](https://github.com/SherTheCoder/coding-club)

The existing club deployment already has its Supabase database, seven member accounts, GitHub Actions variables, and Pages hosting configured. Use those accounts to sign in. Do not run `supabase/setup.sql` again against that project.

## Run locally

1. Install Node.js 24 LTS and Git. If you use nvm, run `nvm install` and `nvm use` in the project directory.
2. Clone the repository:

```sh
git clone https://github.com/SherTheCoder/coding-club.git
cd coding-club
```

3. Install the locked dependencies and create your local settings file:

```sh
npm ci
cp .env.example .env.local
```

4. Edit `.env.local`. Set `VITE_SUPABASE_URL` to the project URL and `VITE_SUPABASE_PUBLISHABLE_KEY` to its publishable key. Both are available in the Supabase project dashboard. Use the existing club project to connect to the same data as the live site. Never put a secret or service-role key in these variables.
5. Start the app:

```sh
npm run dev
```

Open the local URL printed by Vite, normally `http://127.0.0.1:5173/`. Sign in with your assigned email and password. Restart Vite after changing `.env.local`.

6. Before publishing changes, run:

```sh
npm run format:check
npm test
npm run build
npm run preview
```

Open the preview URL printed in the terminal. The production output is `dist/`. Assets use relative paths, so a repository Pages URL works without changing the source. There are no server routes or Cloudflare dependencies. Use `npm run format` to format the source after editing.

## Set up a new Supabase project

Skip this section when using the existing club project. These steps are for a separate installation.

1. Create a Supabase project.
2. Run [supabase/setup.sql](supabase/setup.sql) **once** in its SQL editor. This creates four tables, the seven named members, and two authenticated RPCs. Row-level security is enabled and direct table access is denied.
3. In the Supabase Table Editor, set `email` for each row of `club_members` to that member’s real, lowercase email. No email is included in this repository. The authenticated account determines the member’s identity; visitors cannot claim somebody else’s name.
4. In Authentication → URL Configuration, set **Site URL** and an allowed redirect URL to your exact Pages URL, including its repository path and trailing slash, e.g. `https://sherthecoder.github.io/coding-club/`. Add your local development URL if you need it.
5. Keep the Email provider enabled and disable **Allow new users to sign up**. Create the seven member accounts through the Supabase Auth Admin API with their assigned email, a unique strong password, and `email_confirm: true`. These are administrator-provisioned accounts; no verification or invitation email is sent. Share each initial password privately with its member. No SMTP provider is required. Leave time-boxed sessions, inactivity timeouts, and single-session restrictions disabled.
6. Copy `.env.example` to `.env.local` and fill in the project URL and **publishable key** (legacy `anon` key also works). Never use a secret or `service_role` key in the frontend.
7. Restart the dev server. The local-preview badge disappears when configuration is present. Each member signs in using the email assigned to them in `club_members`.

Public frontend keys are intended to be included in a static bundle. Authorization is enforced by the database, not by keeping that key private.

## Deploy to GitHub Pages

The existing `SherTheCoder/coding-club` repository is already configured. Pushing changes to its `main` branch runs the deployment automatically. For a new repository, complete steps 1–3 first.

1. Create a GitHub repository named `coding-club` and put this folder’s contents at its root. Use the `main` branch, or adjust `.github/workflows/pages.yml` to your chosen branch.
2. In repository Settings → Pages → Build and deployment, select **GitHub Actions**.
3. In Settings → Secrets and variables → Actions → **Variables**, add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
4. Push to `main`. The included workflow installs dependencies, runs the tests, builds the static site, and deploys `dist/`.
5. Check the deployed URL against the Supabase redirect settings in the previous section.

Without those two variables, Pages still deploys, but it runs local preview mode. The build-time Supabase configuration is applied on the next deployment.

To publish changes from your clone:

```sh
git status
git add .
git commit -m "Update coding club"
git push origin main
```

Open the repository's **Actions** tab and wait for **Deploy GitHub Pages** to succeed. GitHub may prompt you to sign in on your first push; `gh auth login` is an option if you have GitHub CLI installed. Never force-push over the existing repository. If you started from the source ZIP, clone the existing repository first and copy the extracted source into that clone, including the `.github` directory.

The `.gitignore` excludes `.env.local`, dependencies, and build output. Keep member email/password lists outside the repository.

## Sign-in behavior

Members sign in with their assigned email and password once per browser profile. The app restores the saved Supabase session on later visits and silently refreshes expired access tokens. There is no app-imposed session timeout. Signing out on one device leaves other devices signed in. Clearing browser data, private browsing, or an administrator revoking a session requires signing in again.

Members can choose a new password in **Profile → Change password** after entering their current password. New passwords must be at least 12 characters. Forgotten passwords require an administrator reset through the Supabase Auth Admin API; there is no email recovery dependency. Keep administrator credentials and initial member passwords out of this repository.

## Features

- Tuesday/Thursday sessions, 6–8 PM IST.
- Three slots per session; one per presenter; no duplicate questions in a session.
- LeetCode link, preparation notes, optional related practice, edit/release.
- Private inbox for each member, with all seven notified on a question change. Browser alerts are optional and work **while the site is open**. The site polls for changes every 20 seconds and on focus.
- Personal practice completion persists independently of a question being changed or released.
- Calendar download with a 30-minute reminder.

In-site prep reminders are added when a member opens or refreshes the app from 4–6 PM IST on a session day. This is not an unattended email or push service. The calendar reminder works through the user’s calendar application.

## Verification

Domain and client-state tests run in Node. The actual Supabase SQL is executed against an embedded PostgreSQL instance (PGlite), with test-only stand-ins for Supabase’s `auth.uid()` and `auth.jwt()`. Tests cover sign-in persistence across client restarts, silent token renewal, device-only sign-out, the email allowlist, direct-access denial, ownership, capacity, duplicates, stale revisions, seven-member notification fanout, practice persistence, and inbox isolation.

For a new deployment, also verify password sign-in and the member mapping against its live Supabase project. The local-preview adapter is for trying the interface, not a shared database.

After deployment, check these flows with real session content:

1. Sign in, reload, and reopen the same browser profile. Your member identity should remain selected.
2. Claim a slot with a LeetCode link, preparation notes, and optional practice link. Another signed-in member should see it after refresh or within 20 seconds, with an inbox update.
3. Edit your question. Another member must not be able to edit it or take your occupied slot. A member can teach only once per session, with three presenters total.
4. Mark a library problem as practiced, reload, and confirm it stays checked.
5. Download the session calendar event and confirm its Tuesday/Thursday time is 6–8 PM in India.

## Troubleshooting

- **Local preview badge:** the two Supabase variables are missing. Add them to `.env.local` for local development, or GitHub Actions Variables for Pages, then restart or redeploy.
- **Invalid login credentials:** use the member's assigned email and password. Ask the maintainer for an administrator reset if needed; there is no password-reset email flow.
- **Email not on the roster:** the account email must match the lowercase email on that member's `club_members` row.
- **No updates while the browser is closed:** expected. Inbox updates appear on the next visit; optional browser alerts run while the site is open.
- **Connection errors:** check that the Supabase project is running and the project URL/key are correct. If the dashboard shows the project as paused, restore it there.
- **Old version after deployment:** confirm the latest Actions run succeeded, then reload the site.

## References

- [Vite: GitHub Pages deployment](https://vite.dev/guide/static-deploy.html#github-pages)
- [Supabase: password sign-in](https://supabase.com/docs/guides/auth/passwords)
- [Supabase: row-level security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase: administrator-created accounts](https://supabase.com/docs/reference/javascript/auth-admin-createuser)
