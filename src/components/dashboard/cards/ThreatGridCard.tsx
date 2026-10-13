import { useState, useMemo, memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertTriangle, MapPin, Clock, Eye, Shield, Crosshair,
  Swords, Car, Users, Pill, Skull, Home, ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSAPSCrime } from '@/contexts/SAPSCrimeContext';
import DemoBadge from '@/components/DemoBadge';

/* ── Crime type config ─────────────────────────────── */
interface CrimeType {
  id: string;
  label: string;
  icon: React.ElementType;
  color: string;
}

const crimeTypes: CrimeType[] = [
  { id: 'robbery', label: 'Robbery', icon: Swords, color: 'hsl(var(--safety-red))' },
  { id: 'hijacking', label: 'Hijacking', icon: Car, color: 'hsl(var(--safety-orange))' },
  { id: 'gbv', label: 'GBV', icon: Users, color: 'hsl(38 92% 55%)' },
  { id: 'drugs', label: 'Drug Activity', icon: Pill, color: 'hsl(280 60% 55%)' },
  { id: 'gang', label: 'Gang-Related', icon: Skull, color: 'hsl(0 0% 55%)' },
  { id: 'burglary', label: 'Burglary', icon: Home, color: 'hsl(var(--primary))' },
];

type Severity = 'low' | 'medium' | 'high' | 'critical';

interface Incident {
  id: string;
  type: string;
  lat: number;
  lng: number;
  datetime: string;
  precinct: string;
  severity: Severity;
  description: string;
}

const severityMeta: Record<Severity, { label: string; color: string; bg: string }> = {
  low: { label: 'Low', color: 'text-safety-yellow', bg: 'bg-safety-yellow/15' },
  medium: { label: 'Medium', color: 'text-safety-orange', bg: 'bg-safety-orange/15' },
  high: { label: 'High', color: 'text-safety-red', bg: 'bg-safety-red/15' },
  critical: { label: 'Critical', color: 'text-destructive', bg: 'bg-destructive/15' },
};

/* ── Mock incident data (Western Cape) ─────────────── */
const generateIncidents = (): Incident[] => {
  const precincts = ['Nyanga', 'Mitchells Plain', 'Khayelitsha', 'Mfuleni', 'Gugulethu', 'Delft', 'Harare', 'Philippi East', 'Kraaifontein', 'Bellville South', 'Cape Town Central', 'Sea Point', 'Woodstock', 'Manenberg', 'Bishop Lavis'];
  const types = ['robbery', 'hijacking', 'gbv', 'drugs', 'gang', 'burglary'];
  const severities: Severity[] = ['low', 'medium', 'high', 'critical'];
  const now = new Date();

  return Array.from({ length: 40 }, (_, i) => {
    const hourOffset = Math.floor(Math.random() * 24);
    const type = types[i % types.length];
    const d = new Date(now);
    d.setHours(hourOffset, Math.floor(Math.random() * 60));
    return {
      id: `inc-${i}`,
      type,
      lat: -33.9 - Math.random() * 0.15,
      lng: 18.4 + Math.random() * 0.2,
      datetime: d.toISOString(),
      precinct: precincts[i % precincts.length],
      severity: severities[Math.min(Math.floor(Math.random() * 4), 3)],
      description: `${crimeTypes.find(c => c.id === type)?.label} reported near ${precincts[i % precincts.length]}`,
    };
  });
};

const ALL_INCIDENTS = generateIncidents();

/* ── Precinct data ─────────────────────────────────── */
interface PrecinctScore {
  name: string;
  score: number;
  robbery: number;
  hijacking: number;
  gbv: number;
  drugs: number;
  gang: number;
  burglary: number;
}

const precinctScores: PrecinctScore[] = [
  { name: 'Nyanga', score: 94, robbery: 32, hijacking: 18, gbv: 24, drugs: 15, gang: 28, burglary: 22 },
  { name: 'Mitchells Plain', score: 89, robbery: 28, hijacking: 14, gbv: 20, drugs: 22, gang: 25, burglary: 18 },
  { name: 'Khayelitsha', score: 87, robbery: 26, hijacking: 16, gbv: 22, drugs: 12, gang: 20, burglary: 20 },
  { name: 'Mfuleni', score: 82, robbery: 22, hijacking: 12, gbv: 18, drugs: 10, gang: 18, burglary: 16 },
  { name: 'Gugulethu', score: 78, robbery: 20, hijacking: 10, gbv: 16, drugs: 14, gang: 16, burglary: 14 },
  { name: 'Delft', score: 74, robbery: 18, hijacking: 8, gbv: 14, drugs: 16, gang: 12, burglary: 12 },
  { name: 'Harare', score: 71, robbery: 16, hijacking: 8, gbv: 12, drugs: 10, gang: 14, burglary: 10 },
  { name: 'Philippi East', score: 68, robbery: 14, hijacking: 6, gbv: 10, drugs: 12, gang: 10, burglary: 8 },
  { name: 'Manenberg', score: 65, robbery: 12, hijacking: 6, gbv: 8, drugs: 14, gang: 12, burglary: 6 },
  { name: 'Bishop Lavis', score: 60, robbery: 10, hijacking: 4, gbv: 8, drugs: 10, gang: 8, burglary: 6 },
];

const getBarColor = (score: number) => {
  if (score >= 85) return 'bg-destructive';
  if (score >= 70) return 'bg-safety-red';
  if (score >= 50) return 'bg-safety-orange';
  return 'bg-safety-yellow';
};

/* ── Anomaly detection mock ────────────────────────── */
interface Anomaly {
  area: string;
  type: string;
  spikePct: number;
  lat: number;
  lng: number;
}

const anomalies: Anomaly[] = [
  { area: 'Nyanga', type: 'Robbery', spikePct: 340, lat: -34.0, lng: 18.58 },
  { area: 'Mitchells Plain', type: 'Hijacking', spikePct: 210, lat: -34.05, lng: 18.62 },
];

/* ── Heatmap grid cell rendering (Recharts-free, CSS grid) ── */
const GRID_ROWS = 8;
const GRID_COLS = 12;

const generateHeatmapCells = (hour: number, activeTypes: Set<string>) => {
  return Array.from({ length: GRID_ROWS * GRID_COLS }, (_, idx) => {
    const row = Math.floor(idx / GRID_COLS);
    const col = idx % GRID_COLS;
    // Simulate density based on hour and position
    const nightBoost = (hour >= 19 || hour <= 5) ? 0.3 : 0;
    const hotzone = (row >= 3 && row <= 6 && col >= 4 && col <= 8) ? 0.35 : 0;
    const base = Math.random() * 0.4 + nightBoost + hotzone;
    const intensity = Math.min(base * (activeTypes.size / 6 + 0.3), 1);
    return { row, col, intensity };
  });
};

const getCellColor = (intensity: number): string => {
  if (intensity >= 0.85) return 'bg-destructive shadow-[0_0_8px_hsl(var(--destructive)/0.6)] animate-pulse-subtle';
  if (intensity >= 0.65) return 'bg-safety-red';
  if (intensity >= 0.4) return 'bg-safety-orange';
  if (intensity >= 0.2) return 'bg-safety-yellow';
  return 'bg-muted/30';
};

/* ── Component ─────────────────────────────────────── */

const ThreatGridCard = memo(() => {
  const { crimeData } = useSAPSCrime();
  const [activeTypes, setActiveTypes] = useState<Set<string>>(new Set(crimeTypes.map(c => c.id)));
  const [hourSlider, setHourSlider] = useState([new Date().getHours()]);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [expandedPrecinct, setExpandedPrecinct] = useState<string | null>(null);

  const toggleType = (id: string) => {
    setActiveTypes(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const hour = hourSlider[0];

  // Filter incidents by active types and hour window (±2h)
  const filteredIncidents = useMemo(() => {
    return ALL_INCIDENTS.filter(inc => {
      if (!activeTypes.has(inc.type)) return false;
      const incHour = new Date(inc.datetime).getHours();
      const diff = Math.abs(incHour - hour);
      return diff <= 2 || diff >= 22; // wrap around midnight
    });
  }, [activeTypes, hour]);

  const heatmapCells = useMemo(() => generateHeatmapCells(hour, activeTypes), [hour, activeTypes]);

  const formatHour = (h: number) => {
    if (h === 0 || h === 24) return '12 AM';
    if (h === 12) return '12 PM';
    return h < 12 ? `${h} AM` : `${h - 12} PM`;
  };

  return (
    <div className="space-y-4">
      {/* ═══ AI Anomaly Alert Banner ═══ */}
      {anomalies.length > 0 && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 backdrop-blur-sm p-3 animate-fade-in">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-destructive animate-pulse-subtle" />
            <span className="text-xs font-bold uppercase tracking-wider text-destructive">AI Anomaly Detected</span>
            <Badge variant="destructive" className="text-[9px] ml-auto">Last 2 hours</Badge>
          </div>
          <div className="space-y-2">
            {anomalies.map((a, i) => (
              <div key={i} className="flex items-center justify-between gap-3 bg-card/60 rounded-md px-3 py-2">
                <div className="flex items-center gap-2 min-w-0">
                  <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{a.area} — {a.type} spike</p>
                    <p className="text-[10px] text-muted-foreground">+{a.spikePct}% above normal</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="text-[10px] h-7 shrink-0 border-destructive/30 text-destructive hover:bg-destructive/10">
                  <Eye className="w-3 h-3 mr-1" /> View
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* ═══ Heatmap + Filters (span 2) ═══ */}
        <Card className="lg:col-span-2 bg-card/80 backdrop-blur-sm border-border/50 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 overflow-hidden">
          <CardHeader className="pb-2 px-4 pt-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Crosshair className="w-4 h-4 text-destructive" />
                Real-Time Threat Grid
               <DemoBadge className="ml-2 align-middle" /></CardTitle>
              <Badge variant="outline" className="text-destructive border-destructive/30 text-[10px]">
                <div className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse-subtle mr-1" />
                LIVE · {filteredIncidents.length} incidents
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-3">
            {/* Crime type toggles */}
            <div className="flex flex-wrap gap-1.5">
              {crimeTypes.map(ct => {
                const Icon = ct.icon;
                const active = activeTypes.has(ct.id);
                return (
                  <button
                    key={ct.id}
                    onClick={() => toggleType(ct.id)}
                    className={cn(
                      'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-medium border transition-all duration-200',
                      active
                        ? 'border-primary/40 bg-primary/10 text-foreground'
                        : 'border-border/50 bg-card/50 text-muted-foreground hover:border-border'
                    )}
                  >
                    <Icon className="w-3 h-3" style={{ color: active ? ct.color : undefined }} />
                    {ct.label}
                  </button>
                );
              })}
            </div>

            {/* CSS Grid Heatmap */}
            <div className="rounded-lg bg-background/60 border border-border/30 p-2 overflow-hidden">
              <div
                className="grid gap-[2px]"
                style={{ gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)`, gridTemplateRows: `repeat(${GRID_ROWS}, 1fr)` }}
              >
                {heatmapCells.map((cell, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      'aspect-square rounded-[2px] transition-all duration-500',
                      getCellColor(cell.intensity)
                    )}
                    style={{ opacity: 0.3 + cell.intensity * 0.7 }}
                    title={`Risk: ${Math.round(cell.intensity * 100)}%`}
                  />
                ))}
              </div>
              {/* Legend */}
              <div className="flex items-center gap-3 mt-2 justify-center">
                {[
                  { label: 'Low', cls: 'bg-safety-yellow' },
                  { label: 'Medium', cls: 'bg-safety-orange' },
                  { label: 'High', cls: 'bg-safety-red' },
                  { label: 'Critical', cls: 'bg-destructive' },
                ].map(l => (
                  <div key={l.label} className="flex items-center gap-1">
                    <div className={cn('w-2.5 h-2.5 rounded-[2px]', l.cls)} />
                    <span className="text-[9px] text-muted-foreground">{l.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Time-of-day slider */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-[11px] text-muted-foreground font-medium">Time of Day</span>
                </div>
                <span className="text-xs font-bold tabular-nums text-foreground">{formatHour(hour)}</span>
              </div>
              <Slider
                min={0}
                max={23}
                step={1}
                value={hourSlider}
                onValueChange={setHourSlider}
                className="w-full"
              />
              <div className="flex justify-between text-[9px] text-muted-foreground/60">
                <span>12 AM</span>
                <span>6 AM</span>
                <span>12 PM</span>
                <span>6 PM</span>
                <span>11 PM</span>
              </div>
            </div>

            {/* Recent incident pins list */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Recent Incidents ({filteredIncidents.length})
              </p>
              <div className="max-h-48 overflow-y-auto space-y-1.5 scrollbar-visible">
                {filteredIncidents.slice(0, 12).map(inc => {
                  const ct = crimeTypes.find(c => c.id === inc.type);
                  const Icon = ct?.icon ?? AlertTriangle;
                  const sev = severityMeta[inc.severity];
                  const time = new Date(inc.datetime);
                  return (
                    <button
                      key={inc.id}
                      onClick={() => setSelectedIncident(selectedIncident?.id === inc.id ? null : inc)}
                      className={cn(
                        'w-full flex items-center gap-2.5 p-2 rounded-md border text-left transition-all duration-200',
                        selectedIncident?.id === inc.id
                          ? 'border-primary/40 bg-primary/5'
                          : 'border-border/30 bg-card/40 hover:border-border'
                      )}
                    >
                      <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: `${ct?.color}20` }}>
                        <Icon className="w-3.5 h-3.5" style={{ color: ct?.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-medium text-foreground truncate">{ct?.label}</span>
                          <Badge className={cn('text-[8px] px-1 py-0 border-0', sev.bg, sev.color)}>{sev.label}</Badge>
                        </div>
                        <p className="text-[10px] text-muted-foreground truncate">{inc.precinct} · {time.getHours()}:{String(time.getMinutes()).padStart(2, '0')}</p>
                      </div>
                      <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected incident popup card */}
            {selectedIncident && (() => {
              const ct = crimeTypes.find(c => c.id === selectedIncident.type);
              const Icon = ct?.icon ?? AlertTriangle;
              const sev = severityMeta[selectedIncident.severity];
              const time = new Date(selectedIncident.datetime);
              return (
                <div className="rounded-lg border border-primary/30 bg-card/90 backdrop-blur-sm p-3 animate-fade-in">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${ct?.color}20` }}>
                      <Icon className="w-5 h-5" style={{ color: ct?.color }} />
                    </div>
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">{ct?.label}</span>
                        <Badge className={cn('text-[9px] px-1.5 py-0 border-0', sev.bg, sev.color)}>{sev.label}</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
                        <div><span className="text-muted-foreground">Precinct:</span> <span className="text-foreground font-medium">{selectedIncident.precinct}</span></div>
                        <div><span className="text-muted-foreground">Date:</span> <span className="text-foreground font-medium">{time.toLocaleDateString('en-ZA')}</span></div>
                        <div><span className="text-muted-foreground">Time:</span> <span className="text-foreground font-medium">{time.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}</span></div>
                        <div><span className="text-muted-foreground">Severity:</span> <span className={cn('font-medium', sev.color)}>{sev.label}</span></div>
                      </div>
                      <Button variant="outline" size="sm" className="text-[10px] h-7 mt-1 border-primary/30">
                        <MapPin className="w-3 h-3 mr-1" /> Report Update
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Footer */}
            <div className="pt-2 border-t border-border/50">
              <p className="text-[9px] text-muted-foreground/60">Western Cape Safety Intelligence · Real-time where available · SAPS {crimeData.quarter} verified data</p>
            </div>
          </CardContent>
        </Card>

        {/* ═══ Precinct Severity Sidebar (span 1) ═══ */}
        <Card className="bg-card/80 backdrop-blur-sm border-border/50 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
          <CardHeader className="pb-2 px-4 pt-4">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Shield className="w-4 h-4 text-destructive" />
              Top 10 High-Risk Precincts
             <DemoBadge className="ml-2 align-middle" /></CardTitle>
            <p className="text-[10px] text-muted-foreground mt-0.5">Western Cape · Live severity index</p>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="space-y-2">
              {precinctScores.map((p, i) => (
                <div key={p.name}>
                  <button
                    onClick={() => setExpandedPrecinct(expandedPrecinct === p.name ? null : p.name)}
                    className="w-full flex items-center gap-2.5 group"
                  >
                    <span className="text-[10px] text-muted-foreground w-4 tabular-nums font-bold">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs font-medium text-foreground truncate group-hover:text-primary transition-colors">{p.name}</span>
                        <span className={cn(
                          'text-xs font-bold tabular-nums',
                          p.score >= 85 ? 'text-destructive' : p.score >= 70 ? 'text-safety-red' : p.score >= 50 ? 'text-safety-orange' : 'text-safety-yellow'
                        )}>{p.score}</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className={cn('h-full rounded-full transition-all duration-700', getBarColor(p.score))}
                          style={{ width: `${p.score}%` }}
                        />
                      </div>
                    </div>
                  </button>
                  {/* Expanded breakdown */}
                  {expandedPrecinct === p.name && (
                    <div className="ml-6 mt-1.5 mb-1 grid grid-cols-3 gap-1.5 animate-fade-in">
                      {([
                        ['Robbery', p.robbery],
                        ['Hijack', p.hijacking],
                        ['GBV', p.gbv],
                        ['Drugs', p.drugs],
                        ['Gang', p.gang],
                        ['Burglary', p.burglary],
                      ] as [string, number][]).map(([label, val]) => (
                        <div key={label} className="bg-muted/40 rounded p-1.5 text-center">
                          <p className="text-[8px] text-muted-foreground uppercase">{label}</p>
                          <p className="text-[11px] font-bold tabular-nums text-foreground">{val}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="pt-3 mt-3 border-t border-border/50">
              <p className="text-[9px] text-muted-foreground/60">Severity index: incidents per 10k population · SAPS {crimeData.quarter}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
});

ThreatGridCard.displayName = 'ThreatGridCard';
export default ThreatGridCard;
