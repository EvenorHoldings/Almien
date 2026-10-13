import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Car, AlertTriangle, MapPin, Clock, Shield, Phone, Eye, Send,
  Navigation, Lock, ChevronRight, TrendingUp, TrendingDown, Minus,
  CircleAlert, Siren, Ban, Target, Crosshair
} from 'lucide-react';
import { cn } from '@/lib/utils';
import DemoBadge from '@/components/DemoBadge';

type TabId = 'hotspots' | 'commute' | 'route-risks' | 'stolen' | 'cit-atm';

interface ViewProps {
  onUpgrade?: (trigger?: string) => void;
  onNavigate?: (view: string) => void;
}

// --- Mock Data ---
const hijackingHotspots = [
  { id: 1, name: 'N2 / Settler\'s Way Off-Ramp', suburb: 'Langa', incidents30d: 14, peakTime: '18:00–21:00', vehicles: ['Toyota Hilux', 'VW Polo'], precinct: 'Langa SAPS', severity: 'critical' as const },
  { id: 2, name: 'Klipfontein Rd / Vanguard Dr', suburb: 'Athlone', incidents30d: 11, peakTime: '17:00–20:00', vehicles: ['Ford Ranger', 'Toyota Fortuner'], precinct: 'Athlone SAPS', severity: 'critical' as const },
  { id: 3, name: 'Robert Sobukwe Rd / Jakes Gerwel', suburb: 'Bellville South', incidents30d: 9, peakTime: '06:00–08:00', vehicles: ['VW Polo', 'Hyundai i20'], precinct: 'Bellville SAPS', severity: 'high' as const },
  { id: 4, name: 'Voortrekker Rd / Frans Conradie Dr', suburb: 'Parow', incidents30d: 7, peakTime: '19:00–22:00', vehicles: ['Toyota Corolla', 'Nissan NP200'], precinct: 'Parow SAPS', severity: 'high' as const },
  { id: 5, name: 'Jan Smuts Dr / M5', suburb: 'Grassy Park', incidents30d: 6, peakTime: '05:30–07:30', vehicles: ['Toyota Hilux', 'BMW 3-Series'], precinct: 'Grassy Park SAPS', severity: 'moderate' as const },
  { id: 6, name: 'Duinefontein Rd / R300', suburb: 'Delft', incidents30d: 12, peakTime: '16:00–19:00', vehicles: ['VW Polo Vivo', 'Ford EcoSport'], precinct: 'Delft SAPS', severity: 'critical' as const },
];

const routeIntersections = [
  { id: 1, name: 'N1 / N7 Interchange', incidents: 8, peakHours: '17:00–19:00', tip: 'Maintain speed through this interchange. Do not stop unnecessarily on the shoulder.' },
  { id: 2, name: 'Modderdam Rd / Voortrekker', incidents: 6, peakHours: '18:00–21:00', tip: 'Keep windows up and doors locked. Do not stop fully at this intersection after dark — slow roll when clear.' },
  { id: 3, name: 'Jan Smuts Dr / Ottery Rd', incidents: 5, peakHours: '05:00–07:00', tip: 'Early morning hijacking risk. Travel in convoy if possible.' },
  { id: 4, name: 'Koeberg Rd / Marine Dr', incidents: 3, peakHours: '20:00–23:00', tip: 'Well-lit area but isolated after dark. Stay alert at the traffic light.' },
];

const citAtmZones = [
  { id: 1, name: 'N1 Goodwood Corridor', type: 'CIT Route' as const, riskLevel: 'high' as const, lastIncident: '2 days ago', incidents30d: 3 },
  { id: 2, name: 'Voortrekker Rd ATM Strip', type: 'ATM Cluster' as const, riskLevel: 'critical' as const, lastIncident: '12 hours ago', incidents30d: 7 },
  { id: 3, name: 'Claremont Main Road', type: 'ATM Cluster' as const, riskLevel: 'moderate' as const, lastIncident: '5 days ago', incidents30d: 2 },
  { id: 4, name: 'R300 / Kuils River', type: 'CIT Route' as const, riskLevel: 'high' as const, lastIncident: '1 day ago', incidents30d: 4 },
  { id: 5, name: 'Wynberg Station Area', type: 'ATM Cluster' as const, riskLevel: 'high' as const, lastIncident: '3 days ago', incidents30d: 5 },
];

const severityColors = {
  critical: 'bg-destructive/10 text-destructive border-destructive/30',
  high: 'bg-orange-500/10 text-orange-600 border-orange-500/30',
  moderate: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
  low: 'bg-muted text-muted-foreground border-border',
};

const SAPSFooter = () => (
  <div className="mt-4 pt-3 border-t border-border text-[10px] text-muted-foreground/60 font-mono flex items-center justify-between">
    <span>Source: SAPS Q3 2025/26 · Vehicle Crime Unit</span>
    <a href="https://www.saps.gov.za" target="_blank" rel="noopener noreferrer" className="underline hover:text-muted-foreground">saps.gov.za</a>
  </div>
);

// --- Tab: Hijacking Hotspots ---
const HotspotsTab = () => (
  <div className="space-y-4">
    <Card className="bg-card/80 backdrop-blur border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Crosshair className="w-4 h-4 text-destructive" />
          Hijacking Hotspot Map Layer
         <DemoBadge className="ml-2 align-middle" /></CardTitle>
        <p className="text-xs text-muted-foreground">Toggle "Vehicle Crime" on the main map to overlay hijacking corridors and high-risk intersections.</p>
      </CardHeader>
      <CardContent>
        {/* Simulated map preview */}
        <div className="rounded-lg bg-muted/30 border border-border/50 p-4 mb-4 text-center">
          <div className="w-full h-32 bg-gradient-to-br from-amber-900/20 via-background to-destructive/10 rounded-lg flex items-center justify-center border border-dashed border-amber-500/30">
            <div className="text-center">
              <Car className="w-8 h-8 text-amber-500 mx-auto mb-1" />
              <span className="text-xs text-muted-foreground">Enable "Vehicle Crime" layer on map</span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          {hijackingHotspots.map(spot => (
            <div key={spot.id} className={cn("rounded-lg border p-3", severityColors[spot.severity])}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate">{spot.name}</div>
                  <div className="text-xs opacity-80 mt-0.5">{spot.suburb} · {spot.precinct}</div>
                </div>
                <Badge variant="outline" className="shrink-0 text-[10px] font-bold uppercase">
                  {spot.incidents30d} incidents
                </Badge>
              </div>
              <div className="flex items-center gap-4 mt-2 text-[11px] opacity-70">
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Peak: {spot.peakTime}</span>
                <span className="flex items-center gap-1"><Car className="w-3 h-3" /> {spot.vehicles.join(', ')}</span>
              </div>
            </div>
          ))}
        </div>
        <SAPSFooter />
      </CardContent>
    </Card>
  </div>
);

// --- Tab: Commuter Risk Profile ---
const CommuteTab = () => {
  const [vehicleMake, setVehicleMake] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehicleColour, setVehicleColour] = useState('');
  const [homeSuburb, setHomeSuburb] = useState('');
  const [workSuburb, setWorkSuburb] = useState('');
  const [commuteMorning, setCommuteMorning] = useState('07:30');
  const [commuteEvening, setCommuteEvening] = useState('17:30');
  const [riskGenerated, setRiskGenerated] = useState(false);

  const handleGenerate = () => setRiskGenerated(true);

  return (
    <div className="space-y-4">
      <Card className="bg-card/80 backdrop-blur border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Car className="w-4 h-4 text-primary" />
            My Vehicle & Commute
           <DemoBadge className="ml-2 align-middle" /></CardTitle>
          <p className="text-xs text-muted-foreground">Enter your vehicle and commute details for a personalised hijacking risk assessment.</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <Input placeholder="Make (e.g. Toyota)" value={vehicleMake} onChange={e => setVehicleMake(e.target.value)} className="text-sm" />
            <Input placeholder="Model (e.g. Hilux)" value={vehicleModel} onChange={e => setVehicleModel(e.target.value)} className="text-sm" />
            <Input placeholder="Colour" value={vehicleColour} onChange={e => setVehicleColour(e.target.value)} className="text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Home suburb" value={homeSuburb} onChange={e => setHomeSuburb(e.target.value)} className="text-sm" />
            <Input placeholder="Work suburb" value={workSuburb} onChange={e => setWorkSuburb(e.target.value)} className="text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] text-muted-foreground mb-1 block">Morning departure</label>
              <Input type="time" value={commuteMorning} onChange={e => setCommuteMorning(e.target.value)} className="text-sm" />
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground mb-1 block">Evening departure</label>
              <Input type="time" value={commuteEvening} onChange={e => setCommuteEvening(e.target.value)} className="text-sm" />
            </div>
          </div>
          <Button onClick={handleGenerate} className="w-full" size="sm">
            <Target className="w-4 h-4 mr-1.5" /> Generate Risk Profile
          </Button>
        </CardContent>
      </Card>

      {riskGenerated && (
        <Card className="bg-card/80 backdrop-blur border-amber-500/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Your Hijacking Risk Score
             <DemoBadge className="ml-2 align-middle" /></CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full border-4 border-amber-500 flex items-center justify-center bg-amber-500/10">
                <span className="text-2xl font-black text-amber-500">62</span>
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-foreground">Moderate-High Risk</div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Your commute passes through 2 known hijacking corridors. Toyota Hilux models are among the top 3 targeted vehicles in the Western Cape.
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Safest Travel Windows</div>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-3 text-center">
                  <Clock className="w-4 h-4 text-emerald-500 mx-auto mb-1" />
                  <div className="text-sm font-bold text-emerald-600">09:00 – 10:30</div>
                  <div className="text-[10px] text-muted-foreground">Post-peak, low incident window</div>
                </div>
                <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-3 text-center">
                  <Clock className="w-4 h-4 text-emerald-500 mx-auto mb-1" />
                  <div className="text-sm font-bold text-emerald-600">14:00 – 15:30</div>
                  <div className="text-[10px] text-muted-foreground">Afternoon lull, well-patrolled</div>
                </div>
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Risk Factors</div>
              <div className="flex items-center gap-2 text-xs">
                <TrendingUp className="w-3 h-3 text-destructive" />
                <span>High-target vehicle model (+18 risk pts)</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <TrendingUp className="w-3 h-3 text-amber-500" />
                <span>Evening commute overlaps peak hijacking window (+12 risk pts)</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <TrendingDown className="w-3 h-3 text-emerald-500" />
                <span>Home suburb has low crime baseline (−8 risk pts)</span>
              </div>
            </div>
            <SAPSFooter />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// --- Tab: Route Risk Intersections ---
const RouteRisksTab = () => (
  <div className="space-y-4">
    <Card className="bg-card/80 backdrop-blur border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Navigation className="w-4 h-4 text-amber-500" />
          Route Risk Intersections
         <DemoBadge className="ml-2 align-middle" /></CardTitle>
        <p className="text-xs text-muted-foreground">High-risk intersections flagged along your planned routes. Each includes tactical safety guidance.</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {routeIntersections.map(ri => (
          <div key={ri.id} className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2">
                <CircleAlert className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                <div>
                  <div className="font-semibold text-sm">{ri.name}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-3">
                    <span>{ri.incidents} incidents (30d)</span>
                    <span>Peak: {ri.peakHours}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-2 p-2 rounded bg-card/60 border border-border/50">
              <div className="text-[10px] font-semibold text-amber-600 uppercase tracking-wider mb-0.5">Safety Tip</div>
              <p className="text-xs text-muted-foreground">{ri.tip}</p>
            </div>
          </div>
        ))}
        <SAPSFooter />
      </CardContent>
    </Card>
  </div>
);

// --- Tab: Stolen Vehicle Alert Network ---
const StolenTab = () => {
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [colour, setColour] = useState('');
  const [plate, setPlate] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const recentAlerts = [
    { id: 1, desc: 'White Toyota Hilux 2.8 GD-6, CA 123-456', time: '12 min ago', distance: '3.2km away' },
    { id: 2, desc: 'Silver VW Polo Vivo, CY 789-012 (partial)', time: '45 min ago', distance: '8.1km away' },
    { id: 3, desc: 'Black BMW 320i, plates removed', time: '2 hours ago', distance: '11km away' },
  ];

  return (
    <div className="space-y-4">
      {/* Report Form */}
      <Card className="bg-card/80 backdrop-blur border-destructive/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Siren className="w-4 h-4 text-destructive" />
            Report Stolen / Suspicious Vehicle
          </CardTitle>
          <p className="text-xs text-muted-foreground">Alert all Almien users within 15km radius immediately.</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Make (e.g. Toyota)" value={make} onChange={e => setMake(e.target.value)} className="text-sm" />
            <Input placeholder="Model (e.g. Hilux)" value={model} onChange={e => setModel(e.target.value)} className="text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Colour" value={colour} onChange={e => setColour(e.target.value)} className="text-sm" />
            <Input placeholder="Number plate (full/partial)" value={plate} onChange={e => setPlate(e.target.value)} className="text-sm" />
          </div>
          <Button
            className="w-full bg-destructive hover:bg-destructive/90"
            size="sm"
            onClick={() => setSubmitted(true)}
            disabled={submitted}
          >
            <Send className="w-4 h-4 mr-1.5" />
            {submitted ? 'Alert Broadcast Sent ✓' : 'Broadcast Stolen Vehicle Alert'}
          </Button>
          {submitted && (
            <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-3 text-center">
              <p className="text-xs text-emerald-600 font-medium">🚗 Alert pushed to all users within 15km. SAPS case reference will be generated.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent alerts feed */}
      <Card className="bg-card/80 backdrop-blur border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Eye className="w-4 h-4 text-primary" />
            Active Stolen Vehicle Alerts Near You
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {recentAlerts.map(alert => (
            <div key={alert.id} className="rounded-lg border border-destructive/20 bg-destructive/5 p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="text-sm font-medium">🚗 {alert.desc}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-3">
                    <span>{alert.time}</span>
                    <span>{alert.distance}</span>
                  </div>
                </div>
                <Badge variant="outline" className="text-[9px] text-destructive border-destructive/30 shrink-0">DO NOT APPROACH</Badge>
              </div>
            </div>
          ))}
          <p className="text-[10px] text-muted-foreground/60 text-center mt-2">Report any sighting to SAPS: 10111</p>
        </CardContent>
      </Card>
    </div>
  );
};

// --- Tab: CIT & ATM Risk Zones ---
const CITTab = () => (
  <div className="space-y-4">
    <Card className="bg-card/80 backdrop-blur border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Lock className="w-4 h-4 text-primary" />
          Cash-in-Transit & ATM Risk Zones
        </CardTitle>
        <p className="text-xs text-muted-foreground">Known CIT robbery corridors and ATM crime clusters. Stay alert in these areas — active incidents trigger "Avoid Area" notifications.</p>
      </CardHeader>
      <CardContent className="space-y-2">
        {citAtmZones.map(zone => (
          <div key={zone.id} className={cn("rounded-lg border p-3", severityColors[zone.riskLevel])}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {zone.type === 'CIT Route' ? (
                    <Car className="w-3.5 h-3.5 shrink-0" />
                  ) : (
                    <Lock className="w-3.5 h-3.5 shrink-0" />
                  )}
                  <span className="font-semibold text-sm truncate">{zone.name}</span>
                </div>
                <div className="text-[11px] opacity-80 mt-0.5 flex items-center gap-3">
                  <Badge variant="outline" className="text-[9px] h-4">{zone.type}</Badge>
                  <span>Last: {zone.lastIncident}</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-lg font-black">{zone.incidents30d}</div>
                <div className="text-[9px] opacity-60">30d</div>
              </div>
            </div>
          </div>
        ))}

        <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-3 mt-3">
          <div className="flex items-start gap-2">
            <Ban className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
            <div>
              <div className="text-xs font-semibold text-destructive">Active Alert Protocol</div>
              <p className="text-[11px] text-muted-foreground mt-0.5">When a CIT heist or ATM bombing is in progress, all Almien users within 2km receive an immediate "AVOID AREA" push notification with alternate routing.</p>
            </div>
          </div>
        </div>
        <SAPSFooter />
      </CardContent>
    </Card>
  </div>
);

// --- Main View ---
const VehicleCrimeView = ({ onUpgrade, onNavigate }: ViewProps) => {
  const [activeTab, setActiveTab] = useState<TabId>('hotspots');

  const tabs: { id: TabId; label: string; icon: typeof Car }[] = [
    { id: 'hotspots', label: 'Hotspots', icon: Crosshair },
    { id: 'commute', label: 'My Commute', icon: Car },
    { id: 'route-risks', label: 'Route Risks', icon: Navigation },
    { id: 'stolen', label: 'Stolen Alert', icon: Siren },
    { id: 'cit-atm', label: 'CIT & ATM', icon: Lock },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
          <Car className="w-6 h-6 text-amber-500" />
          Vehicle Crime Intelligence
        </h2>
        <p className="text-sm text-muted-foreground mt-1">Hijacking hotspots, commuter risk profiles, stolen vehicle alerts & CIT/ATM zones</p>
      </div>

      {/* Hero KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Hijackings (30d)', value: '59', trend: 'up', color: 'text-destructive' },
          { label: 'Top Target Vehicle', value: 'Hilux', trend: 'stable', color: 'text-amber-500' },
          { label: 'CIT Incidents (30d)', value: '14', trend: 'down', color: 'text-emerald-500' },
          { label: 'Active Stolen Alerts', value: '3', trend: 'up', color: 'text-destructive' },
        ].map((kpi, i) => (
          <Card key={i} className="bg-card/80 backdrop-blur border-border/50">
            <CardContent className="p-3 text-center">
              <div className={cn("text-2xl font-black", kpi.color)}>{kpi.value}</div>
              <div className="text-[10px] text-muted-foreground flex items-center justify-center gap-1 mt-0.5">
                {kpi.trend === 'up' && <TrendingUp className="w-3 h-3 text-destructive" />}
                {kpi.trend === 'down' && <TrendingDown className="w-3 h-3 text-emerald-500" />}
                {kpi.trend === 'stable' && <Minus className="w-3 h-3 text-muted-foreground" />}
                {kpi.label}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-1 bg-card/60 rounded-lg p-1 border border-border/50 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium whitespace-nowrap transition-colors',
              activeTab === tab.id
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
            )}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'hotspots' && <HotspotsTab />}
      {activeTab === 'commute' && <CommuteTab />}
      {activeTab === 'route-risks' && <RouteRisksTab />}
      {activeTab === 'stolen' && <StolenTab />}
      {activeTab === 'cit-atm' && <CITTab />}
    </div>
  );
};

export default VehicleCrimeView;
