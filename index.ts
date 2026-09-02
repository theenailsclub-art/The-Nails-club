// ════════════════════════════════════════════════════════════════
// mailchimp-subscribe — Supabase Edge Function
//
// Takes an email from the website's signup popups and adds it to
// your Mailchimp audience. Runs server-side because the Mailchimp
// API key must never be exposed in the browser's JavaScript.
//
// Requires three secrets (Supabase Dashboard → Edge Functions →
// Secrets — same place GA4's secrets already live):
//   MAILCHIMP_API_KEY       — the key you generated in Mailchimp
//   MAILCHIMP_AUDIENCE_ID   — your Audience ID (e.g. 2dbf41951e)
//   MAILCHIMP_SERVER_PREFIX — the region suffix from your API key,
//                              e.g. if the key ends "-us21", this is "us21"
//
// Deploy:  supabase functions deploy mailchimp-subscribe
//          (or paste this file in the Supabase Dashboard's
//          "Deploy a new function" editor)
// Call:    POST /functions/v1/mailchimp-subscribe   body: { "email": "..." }
// ════════════════════════════════════════════════════════════════

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("MAILCHIMP_API_KEY");
    const audienceId = Deno.env.get("MAILCHIMP_AUDIENCE_ID");
    const serverPrefix = Deno.env.get("MAILCHIMP_SERVER_PREFIX");
    if (!apiKey || !audienceId || !serverPrefix) {
      throw new Error("MAILCHIMP_API_KEY / MAILCHIMP_AUDIENCE_ID / MAILCHIMP_SERVER_PREFIX not set");
    }

    const { email, source } = await req.json();
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return new Response(JSON.stringify({ error: "A valid email is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const mcRes = await fetch(
      `https://${serverPrefix}.api.mailchimp.com/3.0/lists/${audienceId}/members`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${btoa(`anystring:${apiKey}`)}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email_address: email,
          status: "subscribed",
          tags: source ? [source] : undefined,
        }),
      },
    );

    const mcData = await mcRes.json();

    // Mailchimp returns 400 "Member Exists" if they already signed up —
    // that's a normal, successful outcome for us, not an error.
    const alreadySubscribed = mcRes.status === 400 && mcData.title === "Member Exists";

    if (!mcRes.ok && !alreadySubscribed) {
      return new Response(JSON.stringify({ error: mcData.detail || "Mailchimp request failed" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true, alreadySubscribed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
