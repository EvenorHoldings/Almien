import { useState } from 'react';
import { CircleMarker, Tooltip } from 'react-leaflet';
import { useTrafficIncidents, severityColor, incidentLabel, type TrafficIncident } from '@/hooks/useTrafficIncidents';
import TrafficIncidentModal from './TrafficIncidentModal';

interface Props { visible: boolean; }

const TrafficIncidentsLayer = ({ visible }: Props) => {
  const { data } = useTrafficIncidents();
  const [active, setActive] = useState<TrafficIncident | null>(null);

  if (!visible || !data?.incidents) return null;

  return (
    <>
      {data.incidents.map((i) => (
        <CircleMarker
          key={i.id}
          center={[i.lat, i.lng]}
          radius={8}
          pathOptions={{
            color: severityColor(i.severity),
            weight: 2,
            fillColor: severityColor(i.severity),
            fillOpacity: 0.65,
          }}
          eventHandlers={{ click: () => setActive(i) }}
        >
          <Tooltip direction="top" offset={[0, -6]} opacity={0.95}>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10 }}>
              {incidentLabel(i.type).toUpperCase()} · {i.ageMin}m
            </div>
          </Tooltip>
        </CircleMarker>
      ))}
      <TrafficIncidentModal incident={active} onClose={() => setActive(null)} />
    </>
  );
};

export default TrafficIncidentsLayer;
