import { memo } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useSapsStations, useHealthFacilities } from '@/hooks/useSafetyMapServices';

const ICON_BLUE = '#00B8FF';   // SAPS — info cyan
const ICON_GREEN = '#00FF85';  // Hospital — signal green

const buildIcon = (color: string, label: string) => {
  return L.divIcon({
    className: 'custom-marker',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    html: `
      <div style="
        width: 28px; height: 28px;
        background: #000;
        border: 2px solid ${color};
        display: flex; align-items: center; justify-content: center;
        font-family: 'JetBrains Mono', monospace;
        font-size: 9px; font-weight: 700; letter-spacing: 0.05em;
        color: ${color};
        box-shadow: 0 0 8px ${color}66;
      ">${label}</div>
    `,
  });
};

const sapsIcon = buildIcon(ICON_BLUE, 'SAPS');
const hospitalIcon = buildIcon(ICON_GREEN, 'H');

interface Props {
  showSaps: boolean;
  showHealth: boolean;
}

const SafetyServicesLayer = memo(({ showSaps, showHealth }: Props) => {
  const { data: sapsStations = [] } = useSapsStations(showSaps);
  const { data: facilities = [] } = useHealthFacilities(showHealth);

  return (
    <>
      {showSaps &&
        sapsStations.map((s) => (
          <Marker key={s.id} position={[s.latitude, s.longitude]} icon={sapsIcon}>
            <Popup>
              <div className="font-mono text-[11px] leading-relaxed min-w-[180px]">
                <div className="text-[10px] tracking-[0.15em] text-[#00B8FF] mb-1">▸ SAPS_STATION</div>
                <div className="font-bold text-foreground">{s.name}</div>
                {s.address && <div className="text-foreground/60">{s.address}</div>}
                {s.phone && (
                  <a href={`tel:${s.phone.replace(/\s/g, '')}`} className="block mt-2 text-[#00B8FF] underline">
                    📞 {s.phone}
                  </a>
                )}
                {s.is_24h && <div className="mt-1 text-[#00FF85]">24H_OPEN</div>}
              </div>
            </Popup>
          </Marker>
        ))}

      {showHealth &&
        facilities.map((f) => (
          <Marker key={f.id} position={[f.latitude, f.longitude]} icon={hospitalIcon}>
            <Popup>
              <div className="font-mono text-[11px] leading-relaxed min-w-[180px]">
                <div className="text-[10px] tracking-[0.15em] text-[#00FF85] mb-1">
                  ▸ {f.facility_type.replace(/_/g, ' ').toUpperCase()}
                </div>
                <div className="font-bold text-foreground">{f.name}</div>
                {f.address && <div className="text-foreground/60">{f.address}</div>}
                {f.has_trauma_unit && <div className="mt-1 text-[#FF3B3B]">TRAUMA_UNIT</div>}
                {f.is_24h && <div className="text-[#00FF85]">24H_OPEN</div>}
                {(f.emergency_phone || f.phone) && (
                  <a
                    href={`tel:${(f.emergency_phone || f.phone)!.replace(/\s/g, '')}`}
                    className="block mt-2 text-[#00FF85] underline"
                  >
                    📞 {f.emergency_phone || f.phone}
                  </a>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
    </>
  );
});

SafetyServicesLayer.displayName = 'SafetyServicesLayer';
export default SafetyServicesLayer;
