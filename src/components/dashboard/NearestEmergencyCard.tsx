import { memo, useMemo } from 'react';
import { Phone, Shield, Cross } from 'lucide-react';
import { useUserLocation } from '@/hooks/useUserLocation';
import { useSapsStations, useHealthFacilities } from '@/hooks/useSafetyMapServices';

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

/**
 * Tactical card showing the nearest SAPS station + nearest 24h hospital,
 * with one-tap dial. Loaded from public Supabase tables.
 */
const NearestEmergencyCard = memo(() => {
  const { coords } = useUserLocation();
  const { data: saps = [] } = useSapsStations(true);
  const { data: hospitals = [] } = useHealthFacilities(true);

  const nearest = useMemo(() => {
    if (!coords) return null;
    const nearestSaps = [...saps]
      .map((s) => ({ ...s, dist: distanceKm(coords, { lat: s.latitude, lng: s.longitude }) }))
      .sort((a, b) => a.dist - b.dist)[0];
    const nearestHosp = [...hospitals]
      .filter((h) => h.is_24h || h.has_trauma_unit)
      .map((h) => ({ ...h, dist: distanceKm(coords, { lat: h.latitude, lng: h.longitude }) }))
      .sort((a, b) => a.dist - b.dist)[0];
    return { saps: nearestSaps, hospital: nearestHosp };
  }, [coords, saps, hospitals]);

  if (!nearest || (!nearest.saps && !nearest.hospital)) return null;

  return (
    <section className="mt-6 px-5">
      <div className="flex items-center justify-between mb-2">
        <span className="label-micro">NEAREST EMERGENCY</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {nearest.saps && (
          <a
            href={nearest.saps.phone ? `tel:${nearest.saps.phone.replace(/\s/g, '')}` : '#'}
            className="block p-3 min-h-[88px]"
            style={{ background: '#0A0A0A', border: '0.5px solid #2A2A2A' }}
          >
            <div className="flex items-center gap-1.5">
              <Shield size={12} color="#00B8FF" />
              <span className="font-mono text-[9px] tracking-[0.2em] text-[#00B8FF]">SAPS</span>
            </div>
            <div className="mt-1 text-[12px] text-white truncate">{nearest.saps.name}</div>
            <div className="mt-1 font-mono text-[10px] text-white/50">
              {nearest.saps.dist.toFixed(1)} km
            </div>
            {nearest.saps.phone && (
              <div className="mt-1 flex items-center gap-1 text-[10px] text-[#00FF85]">
                <Phone size={10} /> CALL
              </div>
            )}
          </a>
        )}
        {nearest.hospital && (
          <a
            href={
              (nearest.hospital.emergency_phone || nearest.hospital.phone)
                ? `tel:${(nearest.hospital.emergency_phone || nearest.hospital.phone)!.replace(/\s/g, '')}`
                : '#'
            }
            className="block p-3 min-h-[88px]"
            style={{ background: '#0A0A0A', border: '0.5px solid #2A2A2A' }}
          >
            <div className="flex items-center gap-1.5">
              <Cross size={12} color="#00FF85" />
              <span className="font-mono text-[9px] tracking-[0.2em] text-[#00FF85]">
                {nearest.hospital.has_trauma_unit ? 'TRAUMA' : 'HOSPITAL'}
              </span>
            </div>
            <div className="mt-1 text-[12px] text-white truncate">{nearest.hospital.name}</div>
            <div className="mt-1 font-mono text-[10px] text-white/50">
              {nearest.hospital.dist.toFixed(1)} km
            </div>
            {(nearest.hospital.emergency_phone || nearest.hospital.phone) && (
              <div className="mt-1 flex items-center gap-1 text-[10px] text-[#00FF85]">
                <Phone size={10} /> CALL
              </div>
            )}
          </a>
        )}
      </div>
    </section>
  );
});

NearestEmergencyCard.displayName = 'NearestEmergencyCard';
export default NearestEmergencyCard;
