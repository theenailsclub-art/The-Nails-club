# Connecting real Google Analytics data — one-time setup

Your site already has real Google Analytics tracking installed (measurement ID
`G-TDZLP08PTF`), so the visitor data already exists — this just wires your
admin dashboard up to read it. The code side is done (`ga4-analytics` Edge
Function + the dashboard's Website / Device / Geographic / Marketing /
Customer tabs). What's left are a few steps only you can do, since they
require your own Google and Supabase logins.

Takes about 10 minutes, and you only do it once.

## 1. Create a Google Cloud service account

A service account is a "robot" Google account your Edge Function uses to
read GA4 data — it never touches your personal Google login.

1. Go to [console.cloud.google.com](https://console.cloud.google.com) and
   create a new project (any name — e.g. "TNC Analytics").
2. In the search bar, go to **APIs & Services → Library**, search
   **"Google Analytics Data API"**, and click **Enable**.
3. Go to **APIs & Services → Credentials → Create Credentials → Service
   account**. Name it anything (e.g. "ga4-dashboard-reader"). You can skip
   granting it any project-level role.
4. Open the service account you just created → **Keys** tab → **Add Key →
   Create new key → JSON**. This downloads a `.json` file — **keep it
   private**, don't paste it into any chat or commit it to a repo.
5. Open that JSON file. You need two values from it:
   - `client_email` — looks like `ga4-dashboard-reader@your-project.iam.gserviceaccount.com`
   - `private_key` — a long string starting with `-----BEGIN PRIVATE KEY-----`

## 2. Give that service account access to your GA4 property

1. Go to [analytics.google.com](https://analytics.google.com) → **Admin**
   (bottom left gear icon) → make sure **The Nails Club**'s property is
   selected.
2. Under the **Property** column, click **Property Access Management**.
3. Click the **+** button → **Add users**.
4. Paste in the `client_email` from step 1.4. Give it the **Viewer** role
   (that's all it needs — read-only).
5. Save.

## 3. Get your GA4 Property ID

This is different from the `G-TDZLP08PTF` measurement ID already in your
site's code — it's a separate, purely numeric ID.

1. Still in GA4 **Admin**, under the **Property** column, click
   **Property details** (or **Property Settings**).
2. Copy the **Property ID** — a number like `123456789`.

## 4. Add the three secrets to Supabase

Using the [Supabase CLI](https://supabase.com/docs/guides/cli) from your
project folder (the one containing the `supabase/functions/ga4-analytics/`
folder I gave you):

```bash
supabase login
supabase link --project-ref tggzcajcmjyfubdxfldw

supabase secrets set GA_CLIENT_EMAIL="ga4-dashboard-reader@your-project.iam.gserviceaccount.com"
supabase secrets set GA_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
MIIEvQI...(the rest of the multi-line key from the JSON file, unchanged)...
-----END PRIVATE KEY-----"
supabase secrets set GA_PROPERTY_ID="123456789"
```

(No Supabase CLI installed? You can also paste these three under
**Project Settings → Edge Functions → Secrets** in the Supabase dashboard
UI instead — same effect.)

## 5. Deploy the function

```bash
supabase functions deploy ga4-analytics
```

## 6. Done

Reload the admin dashboard and open **Analytics**. The Website, Device, and
Geographic tabs will switch from the "not connected" placeholder to real
charts automatically, and the Marketing tab's channel breakdown and the
Customer tab's New/Returning numbers will switch to real Google Analytics
data too (each one now says "Live from Google Analytics" under it).

If it doesn't switch over, open your browser's dev console on the Analytics
page — the dashboard logs the exact reason (e.g. "secrets not set" or a
Google API error) as a warning starting with `[TNC]`, which is usually
enough to tell you which step above to double check.

## What's still NOT connected, and why

- **Newsletter signups** (Customer tab) — this isn't something Google
  Analytics tracks unless you specifically send it a custom event when
  someone signs up, which your site doesn't do yet. It's left as sample
  data with a "Not tracked automatically yet" note so it's honest about
  what it is. If you want this wired up for real, it needs a
  `newsletter_signup` GA4 event fired from your signup form, or a real
  `newsletter_signups` table in Supabase — happy to build either.
- **Revenue trend / conversion funnel** (Website tab) — these were removed
  entirely rather than rebuilt, since they mixed GA4-style traffic data with
  your own order data in a way that's better computed straight from the real
  `orders` table in Supabase (no Google Analytics needed for that one) —
  a separate, smaller task if you want it.
