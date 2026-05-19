import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // --- Require an authenticated caller to prevent unauthenticated abuse of
  //     paid upstream APIs (ESP / OpenWeather) and credit/quota exhaustion. ---
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
    );
    const { data: userData, error: authErr } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", ""),
    );
    if (authErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (_authValidationFailure) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const url = new URL(req.url);
    const service = url.searchParams.get("service");

    // ---------- ESP: Load Shedding Status ----------
    if (service === "esp-status") {
      const espKey = Deno.env.get("ESP_API_KEY");
      if (!espKey) {
        return new Response(
          JSON.stringify({
            status: "demo",
            stage: 0,
            stage_updated: new Date().toISOString(),
            note: "Demo data - Add ESP_API_KEY secret for live EskomSePush data",
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const resp = await fetch("https://developer.sepush.co.za/business/2.0/status", {
        headers: { Token: espKey },
      });
      if (!resp.ok) {
        const body = await resp.text();
        throw new Error(`ESP API error: ${resp.status} ${body}`);
      }
      const data = await resp.json();

      return new Response(
        JSON.stringify({
          status: "live",
          eskom_stage: parseInt(data.status.eskom.stage, 10),
          eskom_updated: data.status.eskom.stage_updated,
          capetown_stage: data.status.capetown ? parseInt(data.status.capetown.stage, 10) : null,
          capetown_updated: data.status.capetown?.stage_updated || null,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ---------- ESP: Area Schedule ----------
    if (service === "esp-area") {
      const areaId = url.searchParams.get("area_id");
      if (!areaId) {
        return new Response(JSON.stringify({ error: "area_id required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const espKey = Deno.env.get("ESP_API_KEY");
      if (!espKey) {
        return new Response(
          JSON.stringify({
            status: "demo",
            area_id: areaId,
            events: [],
            next_outage: null,
            note: "Demo data - Add ESP_API_KEY for live schedule",
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const resp = await fetch(
        `https://developer.sepush.co.za/business/2.0/area?id=${encodeURIComponent(areaId)}`,
        { headers: { Token: espKey } }
      );
      if (!resp.ok) {
        const body = await resp.text();
        throw new Error(`ESP Area API error: ${resp.status} ${body}`);
      }
      const data = await resp.json();
      const nextEvent = data.events?.[0] || null;

      return new Response(
        JSON.stringify({
          status: "live",
          area_id: areaId,
          area_name: data.info?.name || areaId,
          region: data.info?.region || "Western Cape",
          events: data.events || [],
          next_outage: nextEvent
            ? { start: nextEvent.start, end: nextEvent.end, note: nextEvent.note }
            : null,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ---------- OpenWeather ----------
    if (service === "weather") {
      const lat = url.searchParams.get("lat") || "-33.9649";
      const lon = url.searchParams.get("lon") || "18.6017";
      const owKey = Deno.env.get("OPENWEATHER_API_KEY");

      if (!owKey) {
        return new Response(
          JSON.stringify({
            status: "demo",
            temp: 24,
            feels_like: 22,
            wind_speed: 15,
            wind_direction: "SE",
            description: "Clear sky",
            icon: "01d",
            humidity: 55,
            wind_alert: false,
            note: "Demo data - Add OPENWEATHER_API_KEY for live weather",
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const resp = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${owKey}&units=metric`
      );
      if (!resp.ok) {
        const body = await resp.text();
        throw new Error(`OpenWeather error: ${resp.status} ${body}`);
      }
      const data = await resp.json();
      const windKmh = Math.round((data.wind?.speed || 0) * 3.6);

      return new Response(
        JSON.stringify({
          status: "live",
          temp: Math.round(data.main?.temp),
          feels_like: Math.round(data.main?.feels_like),
          wind_speed: windKmh,
          wind_direction: data.wind?.deg || 0,
          description: data.weather?.[0]?.description || "N/A",
          icon: data.weather?.[0]?.icon || "01d",
          humidity: data.main?.humidity,
          wind_alert: windKmh > 40,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ---------- i-TRAFFIC: Incidents + Cameras (mock) ----------
    if (service === "traffic-incidents") {
      const itrKey = Deno.env.get("ITRAFFIC_API_KEY");
      const now = Date.now();
      // Realistic Cape Town hotspots
      const seedIncidents = [
        { id: "i1", lat: -33.9248, lng: 18.4321, type: "accident",     road: "N1 Outbound",        direction: "Northbound",  ageMin: 4,  severity: "high"   },
        { id: "i2", lat: -33.9186, lng: 18.4233, type: "congestion",   road: "Buitengracht St",   direction: "Southbound",  ageMin: 12, severity: "medium" },
        { id: "i3", lat: -33.9352, lng: 18.4724, type: "hijack_alert", road: "M3 near Rondebosch", direction: "Northbound",  ageMin: 8,  severity: "critical" },
        { id: "i4", lat: -33.9580, lng: 18.4640, type: "disabled",     road: "Main Rd, Wynberg",  direction: "Southbound",  ageMin: 22, severity: "low"    },
        { id: "i5", lat: -33.9023, lng: 18.4197, type: "accident",     road: "Helen Suzman Blvd", direction: "Eastbound",   ageMin: 17, severity: "medium" },
        { id: "i6", lat: -33.9710, lng: 18.6020, type: "congestion",   road: "R300 / N2 split",   direction: "Eastbound",   ageMin: 6,  severity: "high"   },
      ];
      const seedCameras = [
        { id: "c1", lat: -33.9249, lng: 18.4241, name: "CBD / Adderley",      url: "https://www.i-traffic.co.za/camera/cbd-adderley" },
        { id: "c2", lat: -33.9352, lng: 18.4724, name: "M3 Newlands",         url: "https://www.i-traffic.co.za/camera/m3-newlands" },
        { id: "c3", lat: -33.9023, lng: 18.4197, name: "Sea Point Promenade", url: "https://www.i-traffic.co.za/camera/sea-point" },
        { id: "c4", lat: -33.9710, lng: 18.6020, name: "N2 / R300",           url: "https://www.i-traffic.co.za/camera/n2-r300" },
        { id: "c5", lat: -33.9580, lng: 18.4640, name: "Wynberg Main",        url: "https://www.i-traffic.co.za/camera/wynberg" },
      ];

      return new Response(
        JSON.stringify({
          status: itrKey ? "live-shaped-mock" : "demo",
          fetched_at: new Date(now).toISOString(),
          ttl_seconds: 300,
          incidents: seedIncidents,
          cameras: seedCameras,
          note: itrKey ? "i-TRAFFIC key present; live integration scaffold pending." : "Mock data — i-TRAFFIC key not set.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Unknown service. Use: esp-status, esp-area, weather, traffic-incidents" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("API Proxy error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
