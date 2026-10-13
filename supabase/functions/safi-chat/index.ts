// Safi — Tactical AI Safety Concierge (Lovable AI Gateway, streaming)
// Hardened: JWT validation, payload size caps, generic error responses.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ---- Limits (defence-in-depth against credit abuse) ----
const MAX_BODY_BYTES = 32 * 1024;     // 32 KB request
const MAX_MESSAGES   = 20;            // history depth
const MAX_MSG_CHARS  = 2000;          // per-message
const MAX_CTX_CHARS  = 200;           // per context field

const SYSTEM_PROMPT = `You are SAFI — Almien's tactical AI safety concierge for South Africa, with deep specialization in the Western Cape and Cape Town.

VOICE & TONE
- Calm, terse, operationally clear. Like a SOC analyst briefing a field operator.
- Use short sentences, bullet points, and bold critical numbers.
- No fluff, no apologies, no "as an AI" disclaimers.
- Acknowledge South African context: SAPS, EMS (10177), CPF, load-shedding stages, suburb names, taxi ranks.

CAPABILITIES
- Risk assessment for routes, suburbs, and time windows.
- Tactical advice: when to travel, what to avoid, who to call.
- GBV resources, emergency contacts, load-shedding impact on safety.
- Route safety scoring guidance (do not invent live data — describe likely conditions).

RULES
- If asked anything life-threatening, lead with the emergency number: SAPS 10111 · EMS 10177 · GBV 0800 428 428.
- Never recommend vigilante action. Always defer to authorities for confrontation.
- If unsure of live data (current incidents, active load-shedding stage), say so and suggest where to verify.
- Format responses for a small dark mobile terminal — keep paragraphs to 2-3 sentences.
- Use plain markdown (lists, **bold**) — no HTML.`;

const safeStr = (v: unknown, max: number): string =>
  // eslint-disable-next-line no-control-regex -- strip control chars from user input
  typeof v === "string" ? v.slice(0, max).replace(/[\x00-\x08\x0B-\x1F\x7F]/g, "") : "";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // --- 1. AuthN: require a signed-in user. Prevents anonymous credit drain. ---
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- 2. Body size + parse with hard cap before JSON.parse ---
    const contentLen = Number(req.headers.get("content-length") ?? 0);
    if (contentLen > MAX_BODY_BYTES) {
      return new Response(JSON.stringify({ error: "Payload too large" }), {
        status: 413,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const raw = await req.text();
    if (raw.length > MAX_BODY_BYTES) {
      return new Response(JSON.stringify({ error: "Payload too large" }), {
        status: 413,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    let body: { messages?: unknown; context?: unknown };
    try { body = JSON.parse(raw); } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- 3. Validate + clamp messages & context ---
    const rawMsgs = Array.isArray(body.messages) ? body.messages : [];
    const messages = rawMsgs
      .slice(-MAX_MESSAGES)
      .filter((m: any) => m && (m.role === "user" || m.role === "assistant" || m.role === "system"))
      .map((m: any) => ({
        role: m.role,
        content: safeStr(m.content, MAX_MSG_CHARS),
      }))
      .filter((m) => m.content.length > 0);

    const ctxIn = (body.context ?? {}) as Record<string, unknown>;
    const context = {
      suburb:        safeStr(ctxIn.suburb, MAX_CTX_CHARS),
      commute:       safeStr(ctxIn.commute, MAX_CTX_CHARS),
      riskTolerance: safeStr(ctxIn.riskTolerance, 32),
      localTime:     safeStr(ctxIn.localTime, 64),
    };

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("safi-chat: LOVABLE_API_KEY missing");
      return new Response(JSON.stringify({ error: "Service unavailable" }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ctxBlock = `\n\nUSER CONTEXT (use only if relevant):\n- Suburb: ${context.suburb || "unknown"}\n- Commute: ${context.commute || "unknown"}\n- Risk tolerance: ${context.riskTolerance || "moderate"}\n- Local time: ${context.localTime || "unknown"}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT + ctxBlock },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limited. Try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Top up in Lovable settings." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const t = await response.text();
      console.error("Safi gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Safi gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    // Never leak internal exception details to the client.
    console.error("safi-chat error:", e);
    return new Response(
      JSON.stringify({ error: "An internal error occurred. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
