// ════════════════════════════════════════════════════════════════
// ga4-analytics — Supabase Edge Function
//
// Pulls REAL visitor data from Google Analytics 4 (via the GA4 Data
// API) for the admin dashboard's Website / Device / Geographic /
// Marketing / Customer analytics tabs. Runs server-side because the
// browser can never safely hold a Google service account's private
// key — it has to sign a short-lived Google OAuth token here, then
// hand the dashboard only the numbers, not the credentials.
//
// Requires three secrets (see admin_auth_setup.sql's sibling doc,
// GA4_SETUP.md, for exact steps to obtain these):
//   GA_CLIENT_EMAIL   — the service account's email address
//   GA_PRIVATE_KEY    — the service account's private key (PEM)
//   GA_PROPERTY_ID    — the numeric GA4 property ID (NOT the
//                        "G-XXXXXXX" measurement ID — a different,
//                        purely numeric ID from GA4 Admin settings)
//
// Deploy:  supabase functions deploy ga4-analytics
// Secrets: supabase secrets set GA_CLIENT_EMAIL=... GA_PRIVATE_KEY="..." GA_PROPERTY_ID=...
// Call:    GET /functions/v1/ga4-analytics?range=30d   (range: 30d | 90d | year)
// ════════════════════════════════════════════════════════════════

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function base64url(input: ArrayBuffer | string): string {
  const bytes = typeof input === "string" ? new TextEncoder().encode(input) : new Uint8Array(input);
  let str = "";
  for (const b of bytes) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// Exchanges the service account's private key for a short-lived Google
// OAuth access token (standard JWT-bearer / "two-legged OAuth" flow —
// no browser, no user consent screen, since this is a server-to-server
// call authorized by the service account being added as a Viewer on
// the GA4 property).
async function getAccessToken(): Promise<string> {
  const clientEmail = Deno.env.get("GA_CLIENT_EMAIL");
  const rawKey = Deno.env.get("GA_PRIVATE_KEY");
  if (!clientEmail || !rawKey) throw new Error("GA_CLIENT_EMAIL / GA_PRIVATE_KEY not set");

  const privateKeyPem = rawKey.replace(/\\n/g, "\n");
  const now = Math.floor(Date.now() / 1000);

  const header = { alg: "RS256", typ: "JWT" };
  const claim = {
    iss: clientEmail,
    scope: "https://www.googleapis.com/auth/analytics.readonly",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };
  const signingInput = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(claim))}`;

  const pemBody = privateKeyPem
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\s/g, "");
  const binaryDer = Uint8Array.from(atob(pemBody), (c) => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    binaryDer.buffer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    new TextEncoder().encode(signingInput),
  );
  const jwt = `${signingInput}.${base64url(signature)}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error("Google token exchange failed: " + JSON.stringify(data));
  return data.access_token as string;
}

function daysForRange(range: string): number {
  if (range === "90d") return 90;
  if (range === "year") return 365;
  return 30;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const range = url.searchParams.get("range") || "30d";
    const days = daysForRange(range);
    const propertyId = Deno.env.get("GA_PROPERTY_ID");
    if (!propertyId) throw new Error("GA_PROPERTY_ID not set");

    const accessToken = await getAccessToken();
    const dateRanges = [{ startDate: `${days}daysAgo`, endDate: "today" }];

    const gaRes = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:batchRunReports`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          requests: [
            { // 0: visitors + page views per day
              dateRanges,
              dimensions: [{ name: "date" }],
              metrics: [{ name: "activeUsers" }, { name: "screenPageViews" }],
              orderBys: [{ dimension: { dimensionName: "date" } }],
            },
            { // 1: device category
              dateRanges,
              dimensions: [{ name: "deviceCategory" }],
              metrics: [{ name: "activeUsers" }],
            },
            { // 2: browser
              dateRanges,
              dimensions: [{ name: "browser" }],
              metrics: [{ name: "activeUsers" }],
              orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
              limit: "6",
            },
            { // 3: geographic (city)
              dateRanges,
              dimensions: [{ name: "city" }],
              metrics: [{ name: "activeUsers" }, { name: "sessions" }],
              orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
              limit: "10",
            },
            { // 4: channel grouping (Instagram/WhatsApp/Google/Direct etc.)
              dateRanges,
              dimensions: [{ name: "sessionDefaultChannelGroup" }],
              metrics: [{ name: "sessions" }],
              orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
              limit: "8",
            },
            { // 5: new vs returning users
              dateRanges,
              dimensions: [{ name: "newVsReturning" }],
              metrics: [{ name: "activeUsers" }],
            },
          ],
        }),
      },
    );
    const gaData = await gaRes.json();
    if (!gaRes.ok) {
      return new Response(JSON.stringify({ error: gaData }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const [trendReport, deviceReport, browserReport, geoReport, channelReport, nvrReport] = gaData.reports;

    const labels: string[] = [];
    const visitors: number[] = [];
    const pageviews: number[] = [];
    for (const row of trendReport.rows || []) {
      const raw = row.dimensionValues[0].value; // YYYYMMDD
      labels.push(`${raw.slice(4, 6)}/${raw.slice(6, 8)}`);
      visitors.push(Number(row.metricValues[0].value));
      pageviews.push(Number(row.metricValues[1].value));
    }

    const device = (deviceReport.rows || []).map((r: any) => ({
      label: r.dimensionValues[0].value,
      value: Number(r.metricValues[0].value),
    }));

    const browser = (browserReport.rows || []).map((r: any) => ({
      label: r.dimensionValues[0].value,
      value: Number(r.metricValues[0].value),
    }));

    const geo = (geoReport.rows || []).map((r: any) => ({
      city: r.dimensionValues[0].value,
      visitors: Number(r.metricValues[0].value),
      sessions: Number(r.metricValues[1].value),
    }));

    const channels = (channelReport.rows || []).map((r: any) => ({
      label: r.dimensionValues[0].value,
      sessions: Number(r.metricValues[0].value),
    }));

    let newUsers = 0, returningUsers = 0;
    for (const r of nvrReport.rows || []) {
      const key = r.dimensionValues[0].value;
      const val = Number(r.metricValues[0].value);
      if (key === "new") newUsers = val;
      else if (key === "returning") returningUsers = val;
    }

    return new Response(
      JSON.stringify({ labels, visitors, pageviews, device, browser, geo, channels, newUsers, returningUsers }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
