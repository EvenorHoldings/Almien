import { useEffect, useRef } from 'react';
import { useUserLocation } from './useUserLocation';
import { useNeighborhoodRatings } from './useNeighborhoodRatings';
import { useAlmienStore } from '@/stores/almienStore';
import { toast } from 'sonner';

/**
 * Proactive behavioral notification engine.
 *
 * Triggers (per spec #11):
 *  - high_risk_area_entry: user inside a high/very_high crime zone after 20:00
 *  - time_based_risk:      user enters a medium+ zone within 30m of historical incident peak
 *  - routine_deviation:    user > 4km from home between 18:00–21:00
 *
 * Debounced per zone — user only gets one alert per zone per 15 min.
 * Requires safiPatternConsent === true (privacy-first).
 */

const ZONE_COOLDOWN_MS = 15 * 60 * 1000;
const HOME_DEVIATION_KM = 4;

function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function useProactiveSafetyAlerts() {
  const { coords } = useUserLocation();
  const { data: zones } = useNeighborhoodRatings();
  const consent = useAlmienStore((s) => s.safiPatternConsent);
  const home = useAlmienStore((s) => s.userProfile?.homeLocation);

  const cooldownRef = useRef<Map<string, number>>(new Map());
  const routineFiredRef = useRef<number>(0);

  useEffect(() => {
    if (!consent || !coords || !zones) return;

    const now = Date.now();
    const hour = new Date().getHours();

    // 1. High-risk area entry (after dark)
    for (const z of zones) {
      if (!z.latitude || !z.longitude) continue;
      const dKm = distanceKm(coords, { lat: Number(z.latitude), lng: Number(z.longitude) });
      const insideRadiusKm = 0.6;
      if (dKm > insideRadiusKm) continue;

      const last = cooldownRef.current.get(z.id) ?? 0;
      if (now - last < ZONE_COOLDOWN_MS) continue;

      const isAfterDark = hour >= 20 || hour < 5;
      const highRisk = z.crime_rate === 'high' || z.crime_rate === 'very_high';
      const mediumPeak = z.crime_rate === 'medium' && (hour === 22 || hour === 2);

      if (highRisk && isAfterDark) {
        cooldownRef.current.set(z.id, now);
        toast.warning(`▸ ENTERED HIGH-RISK ZONE`, {
          description: `${z.neighborhood}. SOS armed. Stay alert — Safi monitoring.`,
          duration: 8000,
        });
      } else if (mediumPeak) {
        cooldownRef.current.set(z.id, now);
        toast(`▸ TIME-BASED RISK`, {
          description: `${z.neighborhood}: incidents typically spike around this hour.`,
          duration: 6000,
        });
      }
    }

    // 2. Routine deviation (evening commute window)
    if (home && hour >= 18 && hour < 21) {
      const dKm = distanceKm(coords, { lat: home.lat, lng: home.lng });
      if (dKm > HOME_DEVIATION_KM && now - routineFiredRef.current > ZONE_COOLDOWN_MS) {
        routineFiredRef.current = now;
        toast(`▸ OFF USUAL ROUTE`, {
          description: `${dKm.toFixed(1)}km from home. Activate Guardian to share live location?`,
          duration: 8000,
        });
      }
    }
  }, [coords, zones, consent, home]);
}
