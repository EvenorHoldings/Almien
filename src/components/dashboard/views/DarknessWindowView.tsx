import { memo, useState, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';
import {
  Zap, AlertTriangle, Shield, Clock, MapPin, Eye, EyeOff, CheckCircle2,
  Calendar, ChevronDown, ChevronUp, Bell, Lock, Crown, Lightbulb, Activity,
  Car, Home, Moon, Sun, TrendingUp, Radio
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import type { ViewId } from '../AlmienDashboard';
import DemoBadge from '@/components/DemoBadge';

interface Props {
  onUpgrade?: (trigger?: string) => void;
  onNavigate?: (view: ViewId) => void;
}

type DWTab = 'alerts' | 'map' | 'schedule' | 'checklist' | 'response';

const tabs: { id: DWTab; label: string; icon: typeof Zap }[] = [
  { id: 'alerts', label: 'Darkness Alerts', icon: Bell },
  { id: 'map', label: 'Map Overlay', icon: MapPin },
  { id: 'schedule', label: 'Risk Planner', icon: Calendar },
  { id: 'checklist', label: 'Checklist', icon: CheckCircle2 },
  { id: 'response', label: 'Response Times', icon: Car },
];

// ─── MOCK DATA ─────────────────────────────────────────────

const darknessAlerts = [
  { id: '1', area: 'Sea Point', stage: 4, minutesUntil: 38, crimeBaseline: 'high', ward: 54 },
  { id: '2', area: 'Khayelitsha', stage: 4, minutesUntil: 98, crimeBaseline: 'critical', ward: 95 },
  { id: '3', area: 'Woodstock', stage: 3, minutesUntil: 158, crimeBaseline: 'moderate', ward: 57 },
  { id: '4', area: 'Camps Bay', stage: 2, minutesUntil: 218, crimeBaseline: 'low', ward: 54 },
];

const mapAreas = [
  { area: 'Khayelitsha', lat: -34.0443, lng: 18.6744, loadshedding: true, crimeHigh: true, stage: 4, restore: '22:30' },
  { area: 'Nyanga', lat: -33.9865, lng: 18.5632, loadshedding: true, crimeHigh: true, stage: 4, restore: '22:30' },
  { area: 'Philippi', lat: -34.0128, lng: 18.5794, loadshedding: true, crimeHigh: true, stage: 4, restore: '22:30' },
  { area: 'Mitchells Plain', lat: -34.0441, lng: 18.6173, loadshedding: true, crimeHigh: false, stage: 4, restore: '22:30' },
  { area: 'Sea Point', lat: -33.9177, lng: 18.3895, loadshedding: true, crimeHigh: false, stage: 4, restore: '20:30' },
  { area: 'Camps Bay', lat: -33.9505, lng: 18.3773, loadshedding: false, crimeHigh: false, stage: 0, restore: '-' },
  { area: 'Woodstock', lat: -33.9263, lng: 18.4487, loadshedding: true, crimeHigh: true, stage: 3, restore: '22:30' },
  { area: 'Goodwood', lat: -33.9116, lng: 18.5463, loadshedding: false, crimeHigh: false, stage: 0, restore: '-' },
];

const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const scheduleSuburbs = [
  {
    name: 'Sea Point', ward: 54,
    slots: [
      { day: 0, start: '20:00', end: '22:30', crimePeak: true },
      { day: 2, start: '14:00', end: '16:30', crimePeak: false },
      { day: 4, start: '06:00', end: '08:30', crimePeak: false },
      { day: 5, start: '20:00', end: '22:30', crimePeak: true },
    ],
  },
  {
    name: 'Khayelitsha', ward: 95,
    slots: [
      { day: 0, start: '18:00', end: '20:30', crimePeak: true },
      { day: 1, start: '22:00', end: '00:30', crimePeak: true },
      { day: 3, start: '14:00', end: '16:30', crimePeak: false },
      { day: 4, start: '18:00', end: '20:30', crimePeak: true },
      { day: 6, start: '20:00', end: '22:30', crimePeak: true },
    ],
  },
  {
    name: 'Woodstock', ward: 57,
    slots: [
      { day: 1, start: '06:00', end: '08:30', crimePeak: false },
      { day: 3, start: '20:00', end: '22:30', crimePeak: true },
      { day: 5, start: '14:00', end: '16:30', crimePeak: false },
    ],
  },
  {
    name: 'Mitchells Plain', ward: 79,
    slots: [
      { day: 0, start: '22:00', end: '00:30', crimePeak: true },
      { day: 2, start: '06:00', end: '08:30', crimePeak: false },
      { day: 4, start: '20:00', end: '22:30', crimePeak: true },
      { day: 6, start: '18:00', end: '20:30', crimePeak: true },
    ],
  },
];

const checklistItems = [
  { id: 'gates', label: 'Lock all gates and doors', icon: Lock },
  { id: 'alarm', label: 'Ensure alarm is on battery backup', icon: Shield },
  { id: 'lights', label: 'Check outdoor motion sensor lights', icon: Lightbulb },
  { id: 'response', label: 'Confirm armed response contact number', icon: Car },
  { id: 'valuables', label: 'Move valuables out of sight from windows', icon: Eye },
];

const responseTimeAreas = [
  { area: 'Sea Point', ward: 54, normalMin: 4.2, degradedMin: 7.8, degradeFactor: 1.86, provider: 'ADT' },
  { area: 'Khayelitsha', ward: 95, normalMin: 12.5, degradedMin: 22.0, degradeFactor: 1.76, provider: 'Fidelity' },
  { area: 'Woodstock', ward: 57, normalMin: 5.8, degradedMin: 9.4, degradeFactor: 1.62, provider: 'Chubb' },
  { area: 'Camps Bay', ward: 54, normalMin: 6.1, degradedMin: 8.5, degradeFactor: 1.39, provider: 'ADT' },
  { area: 'Mitchells Plain', ward: 79, normalMin: 9.3, degradedMin: 16.8, degradeFactor: 1.81, provider: 'Fidelity' },
  { area: 'Goodwood', ward: 2, normalMin: 5.5, degradedMin: 5.5, degradeFactor: 1.0, provider: 'ADT' },
];

// ─── COMPONENT ─────────────────────────────────────────────

const DarknessWindowView = memo(({ onUpgrade }: Props) => {
  const [activeTab, setActiveTab] = useState<DWTab>('alerts');
  const [overlayEnabled, setOverlayEnabled] = useState(true);
  const [showCompounded, setShowCompounded] = useState(true);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [responseOverlay, setResponseOverlay] = useState(true);
  const [loadshedActive, setLoadshedActive] = useState(true);

  const toggleCheck = useCallback((id: string) => {
    setCheckedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const checklistProgress = (checkedItems.size / checklistItems.length) * 100;

  const crimeBaselineColor = (level: string) => {
    switch (level) {
      case 'critical': return 'text-destructive bg-destructive/15';
      case 'high': return 'text-safety-orange bg-safety-orange/15';
      case 'moderate': return 'text-safety-yellow bg-safety-yellow/15';
      default: return 'text-safety-green bg-safety-green/15';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-lg bg-safety-yellow/15 flex items-center justify-center">
            <Zap className="w-5 h-5 text-safety-yellow" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Darkness Windows <DemoBadge className="ml-2 align-middle" /></h1>
            <p className="text-muted-foreground text-sm">Load-shedding × Crime vulnerability intelligence</p>
          </div>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Current Stage', value: '4', sub: 'Active now', color: 'text-destructive', icon: Zap },
          { label: 'Dark Zones', value: '5', sub: 'Areas without power', color: 'text-safety-yellow', icon: EyeOff },
          { label: 'Compounded Risk', value: '3', sub: 'High crime + outage', color: 'text-safety-orange', icon: AlertTriangle },
          { label: 'Next Window', value: '38m', sub: 'Sea Point', color: 'text-primary', icon: Clock },
        ].map(kpi => (
          <div key={kpi.label} className="p-4 rounded-xl border border-border bg-card">
            <div className="flex items-center gap-2 mb-2">
              <kpi.icon className={cn("w-4 h-4", kpi.color)} />
              <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">{kpi.label}</span>
            </div>
            <p className={cn("text-2xl font-extrabold", kpi.color)}>{kpi.value}</p>
            <p className="text-[11px] text-muted-foreground">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-secondary/60 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
              activeTab === tab.id
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ─── TAB: DARKNESS WINDOW ALERTS ───────────────── */}
      {activeTab === 'alerts' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 p-3 rounded-lg bg-safety-yellow/10 text-sm text-muted-foreground">
            <Bell className="w-4 h-4 text-safety-yellow shrink-0" />
            Alerts fire when Stage 2+ is scheduled within 2 hours for your registered areas.
          </div>

          <div className="space-y-3">
            {darknessAlerts.map(alert => (
              <div key={alert.id} className={cn(
                "p-4 rounded-xl border bg-card transition-all",
                alert.minutesUntil <= 60 ? "border-destructive/40 animate-pulse-subtle" : "border-border"
              )}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Zap className={cn("w-4 h-4", alert.minutesUntil <= 60 ? "text-destructive" : "text-safety-yellow")} />
                    <span className="font-semibold text-foreground">{alert.area}</span>
                    <span className="text-[10px] text-muted-foreground">W{alert.ward}</span>
                  </div>
                  <Badge variant="outline" className={cn(
                    "text-[10px] font-bold",
                    crimeBaselineColor(alert.crimeBaseline)
                  )}>
                    {alert.crimeBaseline.toUpperCase()} CRIME
                  </Badge>
                </div>

                <div className="p-3 rounded-lg bg-muted/30 text-sm text-foreground mb-2">
                  ⚡ <strong>Darkness Window Alert:</strong> Stage {alert.stage} load-shedding starts in{' '}
                  <strong className={alert.minutesUntil <= 60 ? "text-destructive" : "text-safety-yellow"}>
                    {alert.minutesUntil} minutes
                  </strong>{' '}
                  in {alert.area}. Crime risk is elevated during this window.
                </div>

                <p className="text-xs text-muted-foreground">
                  ⏱️ Ensure your security is activated. Estimated armed response degradation: +{Math.round(alert.minutesUntil <= 60 ? 85 : 40)}%
                </p>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-xl border border-border bg-card">
            <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
              <Home className="w-4 h-4 text-primary" /> Registered Areas
            </h3>
            <p className="text-xs text-muted-foreground mb-3">
              Set your home and work suburbs in Settings to receive targeted alerts.
            </p>
            <div className="flex gap-2">
              <Badge variant="secondary" className="text-xs">🏠 Sea Point</Badge>
              <Badge variant="secondary" className="text-xs">💼 Woodstock</Badge>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB: MAP OVERLAY ──────────────────────────── */}
      {activeTab === 'map' && (
        <div className="space-y-4">
          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-card flex-1">
              <div className="flex items-center gap-2">
                <EyeOff className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-foreground">Load-Shedding Overlay</span>
              </div>
              <Switch checked={overlayEnabled} onCheckedChange={setOverlayEnabled} />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-card flex-1">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-safety-orange" />
                <span className="text-sm text-foreground">Compounded Risk Zones</span>
              </div>
              <Switch checked={showCompounded} onCheckedChange={setShowCompounded} />
            </div>
          </div>

          {/* Visual Map Representation */}
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="p-3 border-b border-border bg-muted/30 flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" /> Load-Shedding Risk Map
              </span>
              <Badge variant="secondary" className="text-[10px]">LIVE</Badge>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {mapAreas.map(area => {
                  const isCompounded = area.loadshedding && area.crimeHigh;
                  const showArea = overlayEnabled || !area.loadshedding;
                  if (!showArea && !overlayEnabled) return null;
                  return (
                    <div
                      key={area.area}
                      className={cn(
                        "p-3 rounded-lg border transition-all text-center",
                        area.loadshedding && overlayEnabled
                          ? isCompounded && showCompounded
                            ? "bg-safety-orange/15 border-safety-orange/50 animate-pulse-subtle"
                            : "bg-muted/80 border-muted-foreground/30"
                          : "bg-card border-border"
                      )}
                    >
                      <p className="text-sm font-semibold text-foreground">{area.area}</p>
                      {area.loadshedding ? (
                        <>
                          <div className="flex items-center justify-center gap-1 mt-1">
                            <Zap className="w-3 h-3 text-safety-yellow" />
                            <span className="text-[10px] text-safety-yellow font-bold">Stage {area.stage}</span>
                          </div>
                          <p className="text-[10px] text-muted-foreground">Restore: {area.restore}</p>
                          {isCompounded && showCompounded && (
                            <Badge className="mt-1 text-[9px] bg-safety-orange/20 text-safety-orange border-safety-orange/30">
                              ⚠️ COMPOUNDED
                            </Badge>
                          )}
                        </>
                      ) : (
                        <div className="flex items-center justify-center gap-1 mt-1">
                          <Eye className="w-3 h-3 text-safety-green" />
                          <span className="text-[10px] text-safety-green font-medium">Power On</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap items-center gap-4 mt-4 pt-3 border-t border-border text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-muted/80 border border-muted-foreground/30" /> Dark (load-shedding active)</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-safety-orange/20 border border-safety-orange/50 animate-pulse" /> Compounded risk zone</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-card border border-border" /> Power on</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB: RISK PLANNER (SCHEDULE) ──────────────── */}
      {activeTab === 'schedule' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 p-3 rounded-lg bg-accent text-sm text-muted-foreground">
            <Calendar className="w-4 h-4 text-primary shrink-0" />
            7-day grid showing load-shedding slots vs. historical crime peak hours per suburb.
          </div>

          {scheduleSuburbs.map(suburb => (
            <div key={suburb.name} className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground">{suburb.name} <span className="text-muted-foreground text-[10px]">W{suburb.ward}</span></span>
              </div>
              <div className="p-3">
                {/* Day headers */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {weekDays.map(d => (
                    <div key={d} className="text-center text-[10px] font-semibold text-muted-foreground uppercase">{d}</div>
                  ))}
                </div>
                {/* Slot grid */}
                <div className="grid grid-cols-7 gap-1">
                  {weekDays.map((_, dayIdx) => {
                    const slot = suburb.slots.find(s => s.day === dayIdx);
                    return (
                      <div
                        key={dayIdx}
                        className={cn(
                          "p-2 rounded-lg text-center min-h-[60px] flex flex-col items-center justify-center",
                          slot
                            ? slot.crimePeak
                              ? "bg-destructive/15 border border-destructive/30"
                              : "bg-safety-yellow/10 border border-safety-yellow/20"
                            : "bg-muted/20 border border-border/30"
                        )}
                      >
                        {slot ? (
                          <>
                            <Zap className={cn("w-3 h-3 mb-0.5", slot.crimePeak ? "text-destructive" : "text-safety-yellow")} />
                            <span className="text-[9px] font-bold text-foreground">{slot.start}</span>
                            <span className="text-[8px] text-muted-foreground">{slot.end}</span>
                            {slot.crimePeak && (
                              <span className="text-[8px] text-destructive font-bold mt-0.5">RISK</span>
                            )}
                          </>
                        ) : (
                          <span className="text-[9px] text-muted-foreground">Clear</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}

          <div className="flex flex-wrap gap-3 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-destructive/15 border border-destructive/30" /> Outage in crime-peak window</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-safety-yellow/10 border border-safety-yellow/20" /> Outage in safe window</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-muted/20 border border-border/30" /> No outage</span>
          </div>
        </div>
      )}

      {/* ─── TAB: HOME SECURITY CHECKLIST ──────────────── */}
      {activeTab === 'checklist' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-foreground flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" /> Pre-Darkness Checklist
              </h2>
              <Badge variant="secondary" className="text-xs">
                {checkedItems.size}/{checklistItems.length} done
              </Badge>
            </div>

            <Progress value={checklistProgress} className="h-2 mb-4" />

            <div className="space-y-2">
              {checklistItems.map(item => {
                const done = checkedItems.has(item.id);
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      toggleCheck(item.id);
                      if (!done) toast.success(`✓ ${item.label}`);
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 p-4 rounded-xl border transition-all text-left",
                      done
                        ? "bg-primary/10 border-primary/30"
                        : "bg-card border-border hover:border-primary/20"
                    )}
                  >
                    <div className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-colors",
                      done ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    )}>
                      {done ? <CheckCircle2 className="w-4 h-4" /> : <item.icon className="w-3.5 h-3.5" />}
                    </div>
                    <span className={cn(
                      "text-sm font-medium",
                      done ? "text-primary line-through" : "text-foreground"
                    )}>
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {checklistProgress === 100 && (
              <div className="mt-4 p-3 rounded-lg bg-safety-green/15 text-sm text-safety-green font-medium text-center">
                ✅ All security measures confirmed — stay safe during the darkness window.
              </div>
            )}
          </div>

          <div className="p-3 rounded-lg bg-accent text-xs text-muted-foreground">
            💡 Tip: This checklist remembers your completion state for the session. It resets when the darkness window ends.
          </div>
        </div>
      )}

      {/* ─── TAB: ARMED RESPONSE TIMES ─────────────────── */}
      {activeTab === 'response' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-safety-yellow" />
              <span className="text-sm text-foreground">Simulate active load-shedding degradation</span>
            </div>
            <Switch checked={loadshedActive} onCheckedChange={setLoadshedActive} />
          </div>

          <div className="space-y-3">
            {responseTimeAreas.map(area => {
              const currentMin = loadshedActive ? area.degradedMin : area.normalMin;
              const isDegraded = loadshedActive && area.degradeFactor > 1;
              const pctIncrease = Math.round((area.degradeFactor - 1) * 100);
              return (
                <div key={area.area} className={cn(
                  "p-4 rounded-xl border bg-card transition-all",
                  isDegraded && pctIncrease > 60 ? "border-destructive/30" :
                  isDegraded ? "border-safety-yellow/30" : "border-border"
                )}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Car className="w-4 h-4 text-primary" />
                      <span className="font-semibold text-foreground">{area.area}</span>
                      <span className="text-[10px] text-muted-foreground">W{area.ward}</span>
                    </div>
                    <Badge variant="outline" className="text-[10px]">{area.provider}</Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mt-3">
                    <div className="text-center p-2 rounded-lg bg-muted/30">
                      <p className="text-lg font-bold text-foreground">{area.normalMin}m</p>
                      <p className="text-[10px] text-muted-foreground">Normal</p>
                    </div>
                    <div className={cn(
                      "text-center p-2 rounded-lg",
                      isDegraded ? "bg-destructive/10" : "bg-safety-green/10"
                    )}>
                      <p className={cn(
                        "text-lg font-bold",
                        isDegraded ? "text-destructive" : "text-safety-green"
                      )}>
                        {currentMin}m
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {loadshedActive ? 'During Outage' : 'Current'}
                      </p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-muted/30">
                      {isDegraded ? (
                        <>
                          <p className="text-lg font-bold text-safety-orange">+{pctIncrease}%</p>
                          <p className="text-[10px] text-muted-foreground">Degradation</p>
                        </>
                      ) : (
                        <>
                          <p className="text-lg font-bold text-safety-green">0%</p>
                          <p className="text-[10px] text-muted-foreground">No Impact</p>
                        </>
                      )}
                    </div>
                  </div>

                  {isDegraded && pctIncrease > 60 && (
                    <div className="mt-2 p-2 rounded-lg bg-destructive/10 text-[11px] text-destructive flex items-center gap-1.5">
                      <AlertTriangle className="w-3 h-3 shrink-0" />
                      Critical degradation — consider alternative emergency contacts during outage.
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="p-3 rounded-lg bg-accent text-xs text-muted-foreground">
            📊 Response times are estimated based on historical data and traffic signal disruption models during load-shedding.
          </div>
        </div>
      )}

      {/* Elite */}
      <div className="p-6 rounded-xl border border-border bg-card">
        <div className="flex items-center gap-2 mb-3">
          <Crown className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-foreground">Elite Darkness Intelligence</h3>
        </div>
        <ul className="space-y-1.5 mb-4">
          {[
            'Real-time EskomSePush API integration',
            'Personalised darkness window push notifications',
            'Armed response provider direct line integration',
            'Historical risk pattern analysis',
          ].map(f => (
            <li key={f} className="text-sm text-muted-foreground flex items-center gap-2">
              <Crown className="w-3 h-3 text-primary shrink-0" /> {f}
            </li>
          ))}
        </ul>
        <button onClick={() => onUpgrade?.()} className="text-sm font-semibold text-primary hover:underline">
          Upgrade to Elite →
        </button>
      </div>
    </div>
  );
});

DarknessWindowView.displayName = 'DarknessWindowView';
export default DarknessWindowView;
