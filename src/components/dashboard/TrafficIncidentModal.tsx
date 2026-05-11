import { X, ExternalLink } from 'lucide-react';
import { incidentLabel, severityColor, type TrafficIncident } from '@/hooks/useTrafficIncidents';

interface Props { incident: TrafficIncident | null; onClose: () => void; }

/** Compact 3-line modal — passes the 3-Second Rule. */
const TrafficIncidentModal = ({ incident, onClose }: Props) => {
  if (!incident) return null;
  const tone = severityColor(incident.severity);
  return (
    <div
      className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.7)' }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full sm:max-w-sm"
        style={{ background: '#0A0A0A', border: '0.5px solid #2A2A2A' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-3" style={{ borderBottom: '0.5px solid #1F1F1F' }}>
          <div className="flex items-center gap-2">
            <span aria-hidden style={{ width: 8, height: 8, background: tone, borderRadius: 0 }} />
            <div className="mono text-[10px]" style={{ color: tone, letterSpacing: '0.14em' }}>
              {incidentLabel(incident.type).toUpperCase()}
            </div>
          </div>
          <button onClick={onClose} aria-label="Close" className="p-1.5"><X size={16} color="#A0A0A0" /></button>
        </div>
        <div className="p-3 space-y-1.5">
          <div className="text-[14px] text-white">{incident.road}</div>
          <div className="mono text-[11px]" style={{ color: '#A0A0A0' }}>
            {incident.direction} · reported {incident.ageMin} min ago
          </div>
          <div className="mono text-[10px]" style={{ color: '#555', letterSpacing: '0.14em' }}>
            SEVERITY · {incident.severity.toUpperCase()}
          </div>
        </div>
        <a
          href="https://www.i-traffic.co.za/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 p-3 mono text-[11px]"
          style={{ borderTop: '0.5px solid #1F1F1F', color: '#7C3AED', letterSpacing: '0.14em' }}
        >
          VIEW ON i-TRAFFIC <ExternalLink size={12} />
        </a>
      </div>
    </div>
  );
};

export default TrafficIncidentModal;
