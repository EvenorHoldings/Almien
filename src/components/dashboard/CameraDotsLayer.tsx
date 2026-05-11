import { useState } from 'react';
import { CircleMarker } from 'react-leaflet';
import { X, ExternalLink, Camera as CameraIcon } from 'lucide-react';
import { useTrafficIncidents, type TrafficCamera } from '@/hooks/useTrafficIncidents';

interface Props { visible: boolean; }

const CameraDotsLayer = ({ visible }: Props) => {
  const { data } = useTrafficIncidents();
  const [active, setActive] = useState<TrafficCamera | null>(null);

  if (!visible || !data?.cameras) return null;

  return (
    <>
      {data.cameras.map((c) => (
        <CircleMarker
          key={c.id}
          center={[c.lat, c.lng]}
          radius={4}
          pathOptions={{ color: '#7C3AED', weight: 1, fillColor: '#7C3AED', fillOpacity: 0.35 }}
          eventHandlers={{ click: () => setActive(c) }}
        />
      ))}
      {active && (
        <div
          className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.7)' }}
          onClick={() => setActive(null)}
        >
          <div
            className="w-full sm:max-w-sm"
            style={{ background: '#0A0A0A', border: '0.5px solid #2A2A2A' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-3" style={{ borderBottom: '0.5px solid #1F1F1F' }}>
              <div className="flex items-center gap-2">
                <CameraIcon size={14} color="#7C3AED" />
                <span className="mono text-[10px]" style={{ color: '#7C3AED', letterSpacing: '0.14em' }}>TRAFFIC CAM</span>
              </div>
              <button onClick={() => setActive(null)} aria-label="Close" className="p-1.5"><X size={16} color="#A0A0A0" /></button>
            </div>
            <div className="p-3">
              <div className="text-[14px] text-white mb-2">{active.name}</div>
              <div
                className="w-full aspect-video flex items-center justify-center mono text-[10px]"
                style={{ background: '#000', border: '0.5px solid #1F1F1F', color: '#555', letterSpacing: '0.14em' }}
              >
                LIVE THUMB UNAVAILABLE
              </div>
            </div>
            <a
              href={active.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 p-3 mono text-[11px]"
              style={{ borderTop: '0.5px solid #1F1F1F', color: '#7C3AED', letterSpacing: '0.14em' }}
            >
              VIEW LIVE FEED <ExternalLink size={12} />
            </a>
          </div>
        </div>
      )}
    </>
  );
};

export default CameraDotsLayer;
