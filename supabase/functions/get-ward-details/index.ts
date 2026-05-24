// Predictive ward intelligence: crime stats + anomaly + weather + traffic-signal density + risk score.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface BBox { minLat: number; minLng: number; maxLat: number; maxLng: number }

function bboxFromGeoJSON(feature: any): BBox | null {
  try {
    const coords = feature?.geometry?.coordinates?.[0];
    if (!Array.isArray(coords)) return null;
    let minLat = 90, minLng = 180, maxLat = -90, maxLng = -180;
    for (const [lng, lat] of coords) {
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
    }
    return { minLat, minLng, maxLat, maxLng };
  } catch { return null; }
}

function stddev(arr: number[]): number {
  if (arr.length < 2) return 0;
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
  const v = arr.reduce((a, b) => a + (b - mean) ** 2, 0) / arr.length;
  return Math.sqrt(v);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const wardIdRaw = url.searchParams.get("ward_id");
    const wardId = wardIdRaw ? parseInt(wardIdRaw, 10) : NaN;
    if (!wardId || Number.isNaN(wardId)) {
      return new Response(JSON.stringify({ error: "ward_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Ward
    const { data: ward, error: wErr } = await supabase
      .from("wards").select("id, ward_number, ward_name, lat, lng, safety_score, geojson")
      .eq("id", wardId).maybeSingle();
    if (wErr || !ward) {
      return new Response(JSON.stringify({ error: "Ward not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Crime stats — last 56 days
    const since = new Date(); since.setDate(since.getDate() - 56);
    const { data: rows } = await supabase
      .from("crime_stats")
      .select("crime_type, count, date")
      .eq("ward_id", wardId)
      .gte("date", since.toISOString().slice(0, 10));

    const byType = new Map<string, { date: string; count: number }[]>();
    for (const r of (rows ?? []) as any[]) {
      if (!byType.has(r.crime_type)) byType.set(r.crime_type, []);
      byType.get(r.crime_type)!.push({ date: r.date, count: r.count });
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
    const fourWeekAgo = new Date(); fourWeekAgo.setDate(fourWeekAgo.getDate() - 28);

    const crime: any[] = [];
    let totalThisWeek = 0;
    let totalLast4w = 0;
    for (const [type, list] of byType.entries()) {
      const sorted = list.sort((a, b) => a.date.localeCompare(b.date));
      const thisWeek = sorted.filter(d => new Date(d.date) >= weekAgo).reduce((s, d) => s + d.count, 0);
      const last4wDaily = sorted.filter(d => new Date(d.date) >= fourWeekAgo && new Date(d.date) < weekAgo);
      const last4wTotal = last4wDaily.reduce((s, d) => s + d.count, 0);
      const fourWeekAvg = last4wDaily.length ? last4wTotal / (last4wDaily.length / 7) : 0; // per week
      const sd = stddev(last4wDaily.map(d => d.count)) * Math.sqrt(7); // approx weekly sd
      const anomaly = sd > 0 && thisWeek > fourWeekAvg + 2 * sd;
      crime.push({
        crime_type: type,
        this_week: thisWeek,
        four_week_avg: Math.round(fourWeekAvg * 10) / 10,
        anomaly,
        delta_pct: fourWeekAvg ? Math.round(((thisWeek - fourWeekAvg) / fourWeekAvg) * 100) : 0,
      });
      totalThisWeek += thisWeek;
      totalLast4w += last4wTotal;
    }

    // Weather (OpenWeather) — proxied; fall back to demo if no key.
    const lat = Number(ward.lat); const lng = Number(ward.lng);
    let weather: any = { status: "demo", temp: 20, description: "Clear", icon: "01d", rain_mm: 0, main: "Clear" };
    const owKey = Deno.env.get("OPENWEATHER_API_KEY");
    if (owKey && Number.isFinite(lat) && Number.isFinite(lng)) {
      try {
        const r = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${owKey}&units=metric`);
        if (r.ok) {
          const w = await r.json();
          weather = {
            status: "live",
            temp: Math.round(w.main?.temp),
            feels_like: Math.round(w.main?.feels_like),
            description: w.weather?.[0]?.description,
            main: w.weather?.[0]?.main,
            icon: w.weather?.[0]?.icon,
            humidity: w.main?.humidity,
            wind_kmh: Math.round((w.wind?.speed ?? 0) * 3.6),
            rain_mm: w.rain?.["1h"] ?? 0,
          };
        }
      } catch (e) { console.error("weather", e); }
    }

    // Traffic signals via Overpass
    let trafficLights = { count: 0, status: "demo" as "live" | "demo" };
    const bbox = bboxFromGeoJSON(ward.geojson);
    if (bbox) {
      try {
        const q = `[out:json][timeout:15];node["highway"="traffic_signals"](${bbox.minLat},${bbox.minLng},${bbox.maxLat},${bbox.maxLng});out count;`;
        const overpassUrl = Deno.env.get("VITE_OVERPASS_URL") || "https://overpass-api.de/api/interpreter";
        const r = await fetch(overpassUrl, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: `data=${encodeURIComponent(q)}`,
        });
        if (r.ok) {
          const data = await r.json();
          const c = data?.elements?.[0]?.tags?.total ?? data?.elements?.[0]?.count ?? data?.elements?.length ?? 0;
          trafficLights = { count: Number(c) || 0, status: "live" };
        }
      } catch (e) { console.error("overpass", e); }
    }

    // Risk score
    const hour = new Date().getHours();
    const isNight = hour < 6 || hour > 20;
    const weatherRisk = (weather.rain_mm > 0 ? 0.3 : 0) + (weather.main === "Thunderstorm" ? 0.4 : 0);
    const historicalDailyAvg = totalLast4w / 28;
    const todayTotal = (rows ?? []).filter((r: any) => r.date === todayStr).reduce((s: number, r: any) => s + r.count, 0);
    const anomalyFactor = Math.min(1, Math.max(0, (todayTotal - historicalDailyAvg) / (historicalDailyAvg + 1)));
    let riskScore = (isNight ? 30 : 10) + weatherRisk * 40 + anomalyFactor * 30 + (crime.some(c => c.anomaly) ? 15 : 0);
    riskScore = Math.round(Math.min(100, Math.max(0, riskScore)));

    const dominantAnomaly = crime.find(c => c.anomaly);
    const insight = dominantAnomaly
      ? `${dominantAnomaly.crime_type[0].toUpperCase() + dominantAnomaly.crime_type.slice(1)} is trending ${dominantAnomaly.delta_pct}% above the 4-week average. Stay vigilant${isNight ? " — nighttime amplifies this." : "."}`
      : weatherRisk > 0
        ? "Wet conditions historically correlate with higher vehicle theft near intersections. Prefer well-lit routes."
        : isNight
          ? "Nighttime baseline elevated. Stick to monitored corridors and avoid isolated stops."
          : "Conditions nominal. Standard situational awareness advised.";

    return new Response(JSON.stringify({
      ward: { id: ward.id, name: ward.ward_name ?? `Ward ${ward.ward_number}`, ward_number: ward.ward_number, lat, lng },
      weather, traffic_lights: trafficLights,
      crime,
      risk: {
        score: riskScore,
        band: riskScore >= 67 ? "high" : riskScore >= 34 ? "elevated" : "low",
        factors: { is_night: isNight, weather_risk: weatherRisk, anomaly_factor: Math.round(anomalyFactor * 100) / 100 },
        insight,
      },
      generated_at: new Date().toISOString(),
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("get-ward-details", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
