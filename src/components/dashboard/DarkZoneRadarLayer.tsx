import { Circle, Popup } from 'react-leaflet';
import { useMemo } from 'react';
import { useNeighborhoodRatings } from '@/hooks/useNeighborhoodRatings';
import { AlertTriangle } from 'lucide-react';

/**
 * Dark Zone Radar — progressive risk visualization.
 * Concentric pulsing rings sized by severity, colored by risk band.
 * Critical: pulsing red · High: orange · Medium: amber · Low: faint amber
 */

type RiskLevel = 'critical' | 'high' | 'medium' | 'low';

interface Props {
  visible: boolean;
}

const RISK_STYLE: Record<RiskLevel, { color: string; fill: number; ring: number; pulse: boolean }> = {
  critical: { color: '#FF3B30', fill: 0.6, ring: 0.35, pulse: true },
  high:     { color: '#FF9500', fill: 0.5, ring: 0.30, pulse: false },
  medium:   { color: '#FFCC00', fill: 0.4, ring: 0.25, pulse: false },
  low:      { color: '#B98D2A', fill: 0.3, ring: 0.20, pulse: false },
};

const mapCrimeRate = (rate: string, count30d: number): RiskLevel | null => {
  if (rate === 'very_high' || count30d > 80) return 'critical';
  if (rate === 'high') return 'high';
  if (rate === 'medium') return 'medium';
  if (rate === 'low') return 'low';
  return null; // very_low → no dark zone
};

const DarkZoneRadarLayer = ({ visible }: Props) => {
  const { data: ratings } = useNeighborhoodRatings();

  const zones = useMemo(() => {
    if (!ratings) return [];
    return ratings
      .filter((r) => r.latitude && r.longitude)
      .map((r) => {
        const level = mapCrimeRate(r.crime_rate, r.crime_count_30d);
        if (!level) return null;
        return {
          id: r.id,
          name: r.neighborhood,
          lat: Number(r.latitude),
          lng: Number(r.longitude),
          level,
          radius: 350 + Math.min(r.crime_count_30d, 100) * 10,
          activeAlerts: r.crime_count_30d,
          topCrime:
            r.robbery_count >= r.assault_count && r.robbery_count >= r.burglary_count
              ? 'Robbery'
              : r.assault_count >= r.burglary_count
              ? 'Assault'
              : 'Burglary',
        };
      })
      .filter(Boolean) as Array<{
        id: string; name: string; lat: number; lng: number;
        level: RiskLevel; radius: number; activeAlerts: number; topCrime: string;
      }>;
  }, [ratings]);

  if (!visible || zones.length === 0) return null;

  return (
    <>
      {zones.map((z) => {
        const s = RISK_STYLE[z.level];
        return (
          <div key={z.id}>
            {/* Outer ring (severity halo) */}
            <Circle
              center={[z.lat, z.lng]}
              radius={z.radius * 1.6}
              pathOptions={{
                color: s.color,
                weight: 1,
                opacity: s.ring,
                fillColor: s.color,
                fillOpacity: 0,
                dashArray: '4, 6',
              }}
            />
            {/* Mid ring */}
            <Circle
              center={[z.lat, z.lng]}
              radius={z.radius * 1.25}
              pathOptions={{
                color: s.color,
                weight: 1,
                opacity: s.ring,
                fillColor: s.color,
                fillOpacity: s.fill * 0.25,
              }}
            />
            {/* Core hot zone */}
            <Circle
              center={[z.lat, z.lng]}
              radius={z.radius}
              pathOptions={{
                color: s.color,
                weight: 2,
                opacity: 0.9,
                fillColor: s.color,
                fillOpacity: s.fill,
                className: s.pulse ? 'animate-pulse' : undefined,
              }}
            >
              <Popup>
                <div className="font-mono text-[11px] min-w-[200px]">
                  <div
                    className="text-[10px] tracking-[0.2em] mb-1 flex items-center gap-1"
                    style={{ color: s.color }}
                  >
                    <AlertTriangle className="w-3 h-3" />
                    DARK_ZONE · {z.level.toUpperCase()}
                  </div>
                  <div className="font-bold text-foreground text-[12px]">{z.name}</div>
                  <div className="mt-2 grid grid-cols-2 gap-1 text-[10px]">
                    <div className="text-foreground/60">INCIDENTS_30D</div>
                    <div className="text-right text-foreground">{z.activeAlerts}</div>
                    <div className="text-foreground/60">TOP_CRIME</div>
                    <div className="text-right text-foreground">{z.topCrime}</div>
                  </div>
                </div>
              </Popup>
            </Circle>
          </div>
        );
      })}
    </>
  );
};

export default DarkZoneRadarLayer;
