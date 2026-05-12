/**
 * useSafeRoute — Commute Shield v2
 *
 * Real routing via OSRM public demo (router.project-osrm.org) with
 * hazard-fusion ranking. Returns up to 3 alternative routes, each
 * scored against:
 *   - Live traffic incidents within 350m of the route polyline
 *   - Load-shedding stage at departure time (heuristic)
 *   - Time-of-day crime baseline (heuristic 0-1 multiplier)
 *
 * OSRM demo is rate-limited and intended for prototyping; swap to
 * a paid OSRM/HERE/Mapbox endpoint via edge function for prod.
 */
import { useState, useCallback } from 'react';
import { useTrafficIncidents, type TrafficIncident } from './useTrafficIncidents';
import { useLoadshedding } from './useLoadshedding';
import { useActiveRoutesStore } from '@/stores/activeRoutesStore';

export type RouteMode = 'foot' | 'car' | 'taxi' | 'cycling';

export interface SafeRouteAlt {
  id: string;
  name: string;            // TACTICAL // SAFEST etc.
  isSafest: boolean;
  distanceKm: number;
  durationMin: number;
  travelTime: string;      // "23 min"
  geometry: [number, number][]; // [lat, lng] points
  safetyScore: number;     // 0-10
  highRiskIntersections: number; // count of risky proximity hits
  activeIncidents: number; // incidents within buffer
  threats: string[];
  hazardBreakdown: { traffic: number; loadshedding: number; crime: number };
}

interface OsrmRoute {
  distance: number; // meters
  duration: number; // seconds
  geometry: { coordinates: [number, number][]; type: 'LineString' }; // lng,lat
}
interface OsrmResponse { code: string; routes: OsrmRoute[] }

const OSRM_PROFILE: Record<RouteMode, string> = {
  foot:    'foot',
  cycling: 'bike',
  car:     'driving',
  taxi:    'driving',
};

// Haversine distance in meters
function distMeters(a: [number, number], b: [number, number]): number {
  const R = 6371000;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// Decimate polyline (every N points) so proximity test stays cheap
function sample(points: [number, number][], step = 6): [number, number][] {
  if (points.length <= 2) return points;
  const out: [number, number][] = [];
  for (let i = 0; i < points.length; i += step) out.push(points[i]);
  if (out[out.length - 1] !== points[points.length - 1]) out.push(points[points.length - 1]);
  return out;
}

const HAZARD_BUFFER_M = 350;

function severityWeight(s: TrafficIncident['severity']): number {
  return s === 'critical' ? 4 : s === 'high' ? 3 : s === 'medium' ? 2 : 1;
}

function scoreRoute(
  geom: [number, number][],
  incidents: TrafficIncident[],
  loadSheddingStage: number,
  hourOfDay: number,
): { score: number; breakdown: SafeRouteAlt['hazardBreakdown']; nearby: TrafficIncident[]; intersections: number } {
  const sampled = sample(geom, 6);
  const nearby: TrafficIncident[] = [];
  let trafficPenalty = 0;
  let intersections = 0;

  for (const inc of incidents) {
    let minD = Infinity;
    for (const p of sampled) {
      const d = distMeters(p, [inc.lat, inc.lng]);
      if (d < minD) minD = d;
      if (minD < HAZARD_BUFFER_M) break;
    }
    if (minD < HAZARD_BUFFER_M) {
      nearby.push(inc);
      trafficPenalty += severityWeight(inc.severity);
      if (inc.severity === 'high' || inc.severity === 'critical') intersections += 1;
    }
  }

  // Load-shedding penalty (max 2.0 at stage 6+)
  const lsPenalty = Math.min(2.0, loadSheddingStage * 0.35);

  // Time-of-day crime baseline (worst 20:00-04:00)
  const night = hourOfDay >= 20 || hourOfDay <= 4;
  const dusk  = (hourOfDay >= 17 && hourOfDay < 20) || (hourOfDay > 4 && hourOfDay <= 6);
  const crimePenalty = night ? 1.6 : dusk ? 0.8 : 0.3;

  const trafficNorm = Math.min(3.5, trafficPenalty * 0.6);

  const raw = 10 - trafficNorm - lsPenalty - crimePenalty;
  const score = Math.max(1, Math.min(10, +raw.toFixed(1)));

  return {
    score,
    breakdown: {
      traffic: +trafficNorm.toFixed(1),
      loadshedding: +lsPenalty.toFixed(1),
      crime: +crimePenalty.toFixed(1),
    },
    nearby,
    intersections,
  };
}

function buildThreats(nearby: TrafficIncident[], lsStage: number, hour: number): string[] {
  const out: string[] = [];
  if (nearby.length === 0) out.push('No active traffic incidents detected on corridor');
  for (const inc of nearby.slice(0, 3)) {
    out.push(`${inc.type.replace('_', ' ').toUpperCase()} on ${inc.road} (${inc.direction}, ${inc.ageMin}m ago)`);
  }
  if (lsStage >= 4) out.push(`Stage ${lsStage} load-shedding — expect dark intersections`);
  else if (lsStage >= 2) out.push(`Stage ${lsStage} load-shedding active in some zones`);
  if (hour >= 20 || hour <= 4) out.push('Night corridor — elevated baseline risk');
  return out;
}

export function useSafeRoute() {
  const { data: trafficData } = useTrafficIncidents();
  const { status: lsStatus } = useLoadshedding();

  const [routes, setRoutes] = useState<SafeRouteAlt[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const compute = useCallback(async (
    origin: { lat: number; lng: number; label: string },
    destination: { lat: number; lng: number; label: string },
    mode: RouteMode,
    departureHour?: number,
  ) => {
    setLoading(true);
    setError(null);
    setRoutes(null);
    try {
      const profile = OSRM_PROFILE[mode];
      const url =
        `https://router.project-osrm.org/route/v1/${profile}/` +
        `${origin.lng},${origin.lat};${destination.lng},${destination.lat}` +
        `?alternatives=true&overview=full&geometries=geojson&steps=false`;
      const r = await fetch(url);
      if (!r.ok) throw new Error(`OSRM ${r.status}`);
      const json = (await r.json()) as OsrmResponse;
      if (json.code !== 'Ok' || !json.routes?.length) throw new Error('No routes');

      const incidents = trafficData?.incidents ?? [];
      const lsStage = lsStatus?.stage ?? 0;
      const hour = departureHour ?? new Date().getHours();

      // OSRM returns lng,lat — convert to lat,lng for our use
      const enriched = json.routes.slice(0, 3).map((rt, idx) => {
        const geom: [number, number][] = rt.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
        const { score, breakdown, nearby, intersections } = scoreRoute(geom, incidents, lsStage, hour);
        const distanceKm = +(rt.distance / 1000).toFixed(1);
        const durationMin = Math.max(1, Math.round(rt.duration / 60));
        return {
          id: `r${idx}`,
          name: '', // assigned after sort
          isSafest: false,
          distanceKm,
          durationMin,
          travelTime: `${durationMin} min`,
          geometry: geom,
          safetyScore: score,
          highRiskIntersections: intersections,
          activeIncidents: nearby.length,
          threats: buildThreats(nearby, lsStage, hour),
          hazardBreakdown: breakdown,
        } as SafeRouteAlt;
      });

      // Rank: highest safety first, mark fastest by duration
      const fastestId = enriched.reduce((a, b) => (a.durationMin <= b.durationMin ? a : b)).id;
      const ranked = [...enriched].sort((a, b) => b.safetyScore - a.safetyScore);
      ranked.forEach((rt, i) => {
        if (i === 0) { rt.isSafest = true; rt.name = 'TACTICAL // SAFEST'; }
        else if (rt.id === fastestId) { rt.name = 'DIRECT // FASTEST'; }
        else { rt.name = `BYPASS // ALT_${i}`; }
      });

      setRoutes(ranked);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Route computation failed');
    } finally {
      setLoading(false);
    }
  }, [trafficData, lsStatus]);

  return { routes, loading, error, compute, reset: () => setRoutes(null) };
}
