# Supabase setup for Threadswap

## 1. Create project

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. Note your **Project URL** and **anon public** key (Settings → API).

## 2. Run migrations

In the Supabase Dashboard, open **SQL Editor** and run the migrations in order:

1. Run `migrations/001_schema.sql`
2. Run `migrations/002_rls.sql`
3. Run `migrations/003_categories_array.sql` (adds multi-category support for posts)
4. Run `migrations/004_storage_policies.sql` (storage upload/read policies for `post-images`)

## 3. Storage bucket

1. Go to **Storage** in the dashboard.
2. Create a new bucket named **post-images**.
3. Set it to **Public** (so post images can be displayed without signed URLs).
4. **Policies:** You need separate policies for **INSERT** (upload) and **SELECT** (read).  
   Run **`migrations/004_storage_policies.sql`** in the SQL Editor to create them.

   If you prefer the Dashboard:
   - **Policies** for bucket `post-images`:
     - **Upload (INSERT):** Allowed for `authenticated` with condition `bucket_id = 'post-images'`.  
       The policy must be **for operation INSERT**. If you only set a condition like `(bucket_id = 'post-images') AND (auth.role() = 'authenticated')` but the policy is attached to **SELECT** instead of **INSERT**, uploads will fail.
     - **Read (SELECT):** Allowed for `public` (or everyone) with condition `bucket_id = 'post-images'`.

   Common mistake: having a single policy that only applies to **SELECT**. Create an explicit **INSERT** policy for role `authenticated`.

## 4. Auth providers

Under **Authentication → Providers**:

- **Email**: Enable. Turn off "Confirm email" for development if you prefer, or configure SMTP for production.
- **Google**: Enable and add your OAuth client ID and secret from Google Cloud Console.

**Redirect URLs:** Under **Authentication → URL Configuration**, add every URL where users can sign in or land after email confirmation (e.g. `http://localhost:5173/` for dev and `https://your-app.netlify.app/` for production). If the production URL is missing, Supabase falls back to **Site URL** (often localhost), so both Google OAuth and email confirmation links will redirect to the wrong place.

For production, set **Site URL** to your production URL and add the same URL to **Redirect URLs**, or set `VITE_APP_URL` in your build (see below) and add that exact URL to Redirect URLs.

## 5. Environment variables

Create `.env.local` in the project root:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

For production (e.g. Netlify), set **VITE_APP_URL** to your canonical app URL (e.g. `https://your-app.netlify.app`) so email confirmation and OAuth redirect back to the deployed site. Add that URL (with trailing slash) to Supabase **Redirect URLs**.

Do not commit `.env.local`; it is typically in `.gitignore`.
