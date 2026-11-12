# Supabase setup for judge workspaces

The app supports per-visitor Supabase persistence. Without Supabase environment variables, it falls back to browser storage.

1. Create a Supabase project in the account that should own Hunch.
2. In Authentication settings, enable anonymous sign-ins. For a public event, enable a CAPTCHA provider in Supabase and wire the CAPTCHA token into the sign-in form before opening the demo broadly.
3. Run `supabase/migrations/0001_creator_posts.sql` in the project's SQL Editor. The table has row-level security; every row is restricted to its authenticated owner, including anonymous users.
4. Set these environment variables in Vercel Project Settings → Environment Variables (Production and Preview):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
5. Redeploy. The app will create an anonymous session, load that visitor's rows, and sync changes. Never put a Supabase secret/service-role key in the browser or `NEXT_PUBLIC_*` variables.

Anonymous sessions are browser/device scoped. A judge who clears browser storage or switches devices cannot recover that anonymous workspace. Add an account-linking flow if workspace recovery becomes part of the demo requirement.
