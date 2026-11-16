# Mountain Planet Nepal

React + TypeScript + Vite + Tailwind site for Mountain Planet Nepal.

```bash
npm install
npm run dev     # local preview
npm run build   # production build (Vercel runs this)
```

## What changed (Nov 2026)

- **Top navigation, Pinterest style** – the old left side rail is gone. Its links
  (Home, Explore, Destinations, Traveller Stories, Saved, Plan a trip, About) are now a
  pill-tab bar under the main header on tablet/desktop, and in the bottom bar on phones.
- **Traveller Stories** (`/stories`) – customers upload up to 6 photos with their name,
  country, trip, star rating and a written story. Shown as a masonry wall with a photo
  viewer, plus a "Pinned to their hearts" preview on the home page. A "Share your story"
  button is in the header, on the home page and on the stories page.
- **Security clean-up** – removed a malicious obfuscated `init` script that ran on every
  `npm run dev` / `npm run build`, and third-party session-recording / editor scripts
  that had been injected into `index.html`.

## Turning on shared Traveller Stories (≈10 minutes, free)

Until this is set up, a story only shows on the device of the person who posted it.
To make uploads visible to everyone (after you approve them):

1. Create a free project at [supabase.com](https://supabase.com).
2. In Supabase open **SQL Editor → New query**, paste the contents of
   `supabase/stories.sql`, and click **Run**.
3. In Supabase open **Project Settings → API** and copy the **Project URL** and the
   **anon public** key.
4. In Vercel open your project → **Settings → Environment Variables** and add:
   - `VITE_SUPABASE_URL` = the Project URL
   - `VITE_SUPABASE_ANON_KEY` = the anon public key
5. Redeploy. New stories now arrive in Supabase **Table Editor → stories**. Tick
   **approved** on a row to publish it on the site; delete the row to reject it.

Photos are resized in the visitor's browser before upload (max ~1800px JPEG), so they
stay small and load fast.
