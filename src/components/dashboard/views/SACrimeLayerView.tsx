import { useState, memo, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Shield, Zap, Users, Navigation, Share2, AlertTriangle, TrendingDown, MapPin, RefreshCw, ExternalLink,
  Siren, CloudRain, Clock, Bell, Activity
} from 'lucide-react';
import {
  ResponsiveContainer, RadialBarChart, RadialBar, LineChart, Line,
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  Legend, PolarAngleAxis
} from 'recharts';
import { useSAPSCrime } from '@/contexts/SAPSCrimeContext';
import SafeEducationRetailDirectory from '@/components/dashboard/SafeEducationRetailDirectory';
import CitizenReportingCard from '@/components/dashboard/cards/CitizenReportingCard';
import LiveAlertsCard from '@/components/dashboard/cards/LiveAlertsCard';
import HeatmapCard from '@/components/dashboard/cards/HeatmapCard';
import GBVTrackerCard from '@/components/dashboard/cards/GBVTrackerCard';
import SOSPanelCard from '@/components/dashboard/cards/SOSPanelCard';
import ResponseLeaderboardCard from '@/components/dashboard/cards/ResponseLeaderboardCard';
import ThreatGridCard from '@/components/dashboard/cards/ThreatGridCard';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import DemoBadge from '@/components/DemoBadge';

/* ── Static chart data (non-SAPS) ──────────────────────── */

const suburbTrend24h = Array.from({ length: 24 }, (_, h) => ({
  hour: `${h}:00`,
  risk: 30 + Math.sin((h - 3) * 0.5) * 25 + (h >= 18 || h <= 5 ? 20 : 0) + Math.round(Math.random() * 8),
}));

const loadsheddingCorrelation = Array.from({ length: 12 }, (_, i) => ({
  month: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][i],
  stageHours: [48, 32, 60, 80, 120, 96, 72, 110, 140, 88, 56, 44][i],
  robbery: [120, 98, 140, 180, 220, 190, 160, 210, 260, 175, 130, 110][i],
  assault: [85, 72, 95, 120, 150, 135, 110, 145, 180, 125, 90, 78][i],
  burglary: [200, 165, 230, 290, 350, 310, 260, 340, 420, 280, 210, 180][i],
}));

const communityIncidents = [
  { type: 'Suspicious vehicle', count: 14 },
  { type: 'Break-in attempt', count: 11 },
  { type: 'Loitering group', count: 9 },
  { type: 'Cable theft', count: 7 },
  { type: 'Armed robbery', count: 5 },
];

const precinctGauges = [
  { name: 'CPT Central', score: 72 },
  { name: 'Sea Point', score: 58 },
  { name: 'Woodstock', score: 65 },
];

const routeOptions = [
  { name: 'N2 via Airport', safety: 82, time: '25 min' },
  { name: 'M5 Southern', safety: 71, time: '30 min' },
  { name: 'R300 / N1', safety: 64, time: '35 min' },
];

const routeRiskProfile = Array.from({ length: 10 }, (_, i) => ({
  km: `${i + 1}km`,
  risk: [18, 22, 35, 52, 68, 45, 30, 25, 20, 15][i],
}));

const predictorOutput = Array.from({ length: 24 }, (_, h) => ({
  hour: `${h}:00`,
  predicted: 20 + Math.sin((h - 4) * 0.45) * 30 + (h >= 19 || h <= 4 ? 25 : 0),
  historical: 25 + Math.sin((h - 4) * 0.45) * 28 + (h >= 19 || h <= 4 ? 22 : 0),
}));

/* ── Tooltip Style ──────────────────────────────────────── */
const tooltipStyle = {
  contentStyle: {
    background: 'hsl(220 18% 10%)',
    border: '1px solid hsl(220 14% 18%)',
    borderRadius: 8,
    fontSize: 12,
    color: 'hsl(210 40% 98%)',
  },
};

/* ── SAPS Source Footer ─────────────────────────────────── */
const SAPSFooter = ({ quarter, lastSynced }: { quarter: string; lastSynced: string }) => {
  const syncDate = new Date(lastSynced).toLocaleDateString('en-ZA', { month: 'short', day: 'numeric', year: 'numeric' });
  return (
    <div className="pt-2 mt-3 border-t border-border/50 flex flex-wrap items-center gap-x-2 gap-y-1">
      <span className="text-[10px] text-muted-foreground/70">SAPS {quarter}</span>
      <span className="text-[10px] text-muted-foreground/50">•</span>
      <span className="text-[10px] text-muted-foreground/70">Last sync: {syncDate}</span>
      <span className="text-[10px] text-muted-foreground/50">•</span>
      <a
        href="https://www.saps.gov.za/services/crimestats.php"
        target="_blank"
        rel="noopener noreferrer"
        className="text-[10px] text-primary/70 hover:text-primary flex items-center gap-0.5"
      >
        saps.gov.za <ExternalLink className="w-2.5 h-2.5" />
      </a>
    </div>
  );
};

/* ── Tab definitions ────────────────────────────────────── */
type TabKey = 'now' | 'predictions' | 'community' | 'directories';

const tabConfig: { id: TabKey; label: string; icon: React.ElementType }[] = [
  { id: 'now', label: 'Today / Now', icon: Activity },
  { id: 'predictions', label: 'Predictions', icon: TrendingDown },
  { id: 'community', label: 'Community', icon: Users },
  { id: 'directories', label: 'Directories', icon: MapPin },
];

/* ── Floating SOS Button ────────────────────────────────── */
const FloatingSOS = () => {
  const triggerSOS = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          const msg = `🆘 EMERGENCY! I need help. My location: https://maps.google.com/?q=${latitude},${longitude}`;
          navigator.clipboard.writeText(msg).catch(() => {});
          window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
          toast.error('SOS Activated — Location shared', { duration: 5000 });
        },
        () => toast.error('SOS Activated — Could not get location', { duration: 5000 })
      );
    } else {
      toast.error('Geolocation unavailable', { duration: 5000 });
    }
  };

  return (
    <button
      onClick={triggerSOS}
      className="fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full bg-destructive text-destructive-foreground shadow-lg shadow-destructive/30 flex items-center justify-center hover:scale-110 active:scale-95 transition-transform duration-200 animate-fade-in"
      aria-label="Emergency SOS"
    >
      <div className="flex flex-col items-center leading-none">
        <Siren className="w-5 h-5 mb-0.5" />
        <span className="text-[10px] font-black tracking-wider">SOS</span>
      </div>
    </button>
  );
};

/* ── Component ──────────────────────────────────────────── */

const SACrimeLayerView = memo(() => {
  const { crimeData, isRefreshing, refreshData } = useSAPSCrime();
  const [activeTab, setActiveTab] = useState<TabKey>('now');
  const [startSuburb, setStartSuburb] = useState('');
  const [destSuburb, setDestSuburb] = useState('');
  const [showRoutes, setShowRoutes] = useState(false);
  const [predictorFrom, setPredictorFrom] = useState('');
  const [predictorTo, setPredictorTo] = useState('');
  const [showPredictor, setShowPredictor] = useState(false);

  const currentRisk = 62;
  const nationalAvg = 55;
  const gaugeData = [{ value: currentRisk, fill: 'url(#riskGradient)' }];
  const hotspots = crimeData.hotspots;
  const maxHotspot = hotspots[0]?.incidents ?? 1;

  /* ── Hero KPI data ── */
  const heroKPIs = useMemo(() => [
    { label: 'Suburb Risk', value: `${currentRisk}/100`, color: currentRisk > 60 ? 'text-destructive' : 'text-primary', icon: Shield },
    { label: "Today's Change", value: `↓ ${Math.abs(crimeData.totalContactCrimes.changePct)}%`, color: 'text-primary', icon: TrendingDown },
    { label: 'Active Alerts', value: '3', color: 'text-safety-yellow', icon: Bell },
    { label: 'Loadshedding', value: 'Stage 2 · 20:00', color: 'text-safety-orange', icon: Zap },
    { label: 'Nearest Security', value: '~8 min', color: 'text-primary', icon: Clock },
    { label: 'Weather Risk', value: 'Low', color: 'text-primary', icon: CloudRain },
  ], [currentRisk, crimeData.totalContactCrimes.changePct]);

  return (
    <div className="space-y-4 animate-fade-in relative">
      {/* ═══ Section Header ═══ */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
            <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            SA Crime & Loadshedding Intelligence
            <DemoBadge label="Static snapshot" />
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">SAPS {crimeData.quarter} · {crimeData.period}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={refreshData} disabled={isRefreshing} className="text-xs">
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Syncing…' : 'Refresh'}
          </Button>
          <Badge variant="outline" className="text-primary border-primary/30 text-xs">
            <Zap className="w-3 h-3 mr-1" /> LIVE
          </Badge>
        </div>
      </div>

      {/* ═══ Hero KPI Row ═══ */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {heroKPIs.map(kpi => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.label} className="bg-card/80 backdrop-blur-sm border-border/50 hover:border-primary/20 transition-all duration-300">
              <CardContent className="p-3 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
                  <Icon className={cn("w-4 h-4", kpi.color)} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider truncate">{kpi.label}</p>
                  <p className={cn("text-sm font-bold tabular-nums", kpi.color)}>{kpi.value}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ═══ SAPS Notes Banner ═══ */}
      {crimeData.notes.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {crimeData.notes.map((note, i) => (
            <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-safety-yellow/10 border border-safety-yellow/20">
              <AlertTriangle className="w-3 h-3 text-safety-yellow shrink-0" />
              <span className="text-[11px] text-foreground">{note}</span>
            </div>
          ))}
        </div>
      )}

      {/* ═══ Tab Bar ═══ */}
      <div className="border-b border-border/50 overflow-x-auto scrollbar-hide">
        <div className="flex gap-0 min-w-max">
          {tabConfig.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-all duration-200 border-b-2 whitespace-nowrap",
                  isActive
                    ? "text-primary border-primary"
                    : "text-muted-foreground border-transparent hover:text-foreground hover:border-border"
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ═══ Tab Content ═══ */}
      <div className="animate-fade-in" key={activeTab}>

        {/* ── TODAY / NOW ── */}
        {activeTab === 'now' && (
          <div className="space-y-4">
            {/* Real-Time Threat Grid */}
            <ThreatGridCard />

            {/* Live Alerts + Heatmap */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <HeatmapCard />
              </div>
              <LiveAlertsCard />
            </div>

            {/* Suburb Risk Gauge + Loadshedding Correlation */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Suburb Risk Gauge */}
              <Card className="bg-card/80 backdrop-blur-sm border-border/50 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
                <CardHeader className="pb-2 px-4 pt-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold">Your Suburb Risk Tonight</CardTitle>
                    <div className="text-right">
                      <span className="text-2xl font-bold tabular-nums text-foreground">{currentRisk}</span>
                      <p className="text-[10px] text-muted-foreground">
                        {currentRisk > nationalAvg ? (
                          <span className="text-destructive">+{currentRisk - nationalAvg} vs national avg</span>
                        ) : (
                          <span className="text-primary">{nationalAvg - currentRisk} below avg</span>
                        )}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadialBarChart innerRadius="65%" outerRadius="100%" data={gaugeData} startAngle={180} endAngle={0} barSize={12}>
                        <defs>
                          <linearGradient id="riskGradient" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="hsl(var(--safety-green))" />
                            <stop offset="50%" stopColor="hsl(var(--safety-yellow))" />
                            <stop offset="100%" stopColor="hsl(var(--safety-red))" />
                          </linearGradient>
                        </defs>
                        <PolarAngleAxis type="number" domain={[0, 100]} tick={false} angleAxisId={0} />
                        <RadialBar dataKey="value" cornerRadius={6} animationDuration={1000} animationEasing="ease-out" animationBegin={0} isAnimationActive={true} />
                      </RadialBarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="h-20 mt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={suburbTrend24h}>
                        <Line type="monotone" dataKey="risk" stroke="hsl(var(--primary))" strokeWidth={1.5} dot={false} animationDuration={1000} animationEasing="ease-out" animationBegin={200} isAnimationActive={true} />
                        <Tooltip {...tooltipStyle} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <SAPSFooter quarter={crimeData.quarter} lastSynced={crimeData.lastSynced} />
                </CardContent>
              </Card>

              {/* Loadshedding + Crime Correlation */}
              <Card className="lg:col-span-2 bg-card/80 backdrop-blur-sm border-border/50 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
                <CardHeader className="pb-2 px-4 pt-4">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Zap className="w-4 h-4 text-safety-yellow" />
                    Loadshedding + Crime Spikes
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-4">
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={loadsheddingCorrelation}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
                        <Tooltip {...tooltipStyle} />
                        <Legend wrapperStyle={{ fontSize: 10 }} />
                        <Area type="monotone" dataKey="stageHours" name="Stage Hours" stroke="hsl(var(--safety-yellow))" fill="hsl(var(--safety-yellow))" fillOpacity={0.15} strokeWidth={2} animationDuration={1000} animationEasing="ease-out" animationBegin={0} isAnimationActive={true} />
                        <Area type="monotone" dataKey="robbery" name="Robbery" stroke="hsl(var(--safety-red))" fill="hsl(var(--safety-red))" fillOpacity={0.1} strokeWidth={1.5} animationDuration={1000} animationEasing="ease-out" animationBegin={200} isAnimationActive={true} />
                        <Area type="monotone" dataKey="assault" name="Assault" stroke="hsl(var(--safety-orange))" fill="none" strokeWidth={1.5} strokeDasharray="4 4" animationDuration={1000} animationEasing="ease-out" animationBegin={400} isAnimationActive={true} />
                        <Area type="monotone" dataKey="burglary" name="Burglary" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.08} strokeWidth={1.5} animationDuration={1000} animationEasing="ease-out" animationBegin={600} isAnimationActive={true} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  {/* Top 5 Spike Hotspots */}
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Top 5 Spike Hotspots</p>
                    <div className="space-y-2">
                      {hotspots.map((h, i) => (
                        <div key={h.name} className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground w-4 tabular-nums">{i + 1}</span>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-0.5">
                              <span className="text-xs font-medium text-foreground">{h.name}</span>
                              <span className="text-[10px] text-muted-foreground">{h.province}</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                              <div className="h-full rounded-full bg-destructive/70 transition-all duration-700" style={{ width: `${(h.incidents / maxHotspot) * 100}%` }} />
                            </div>
                          </div>
                          <span className="text-xs tabular-nums text-muted-foreground w-8 text-right">{h.incidents}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <SAPSFooter quarter={crimeData.quarter} lastSynced={crimeData.lastSynced} />
                </CardContent>
              </Card>
            </div>

            {/* Family Commute */}
            <Card className="bg-card/80 backdrop-blur-sm border-border/50 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
              <CardHeader className="pb-2 px-4 pt-4">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-primary" />
                  Safest Route for Your Family
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-4">
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input placeholder="Start suburb (e.g. Camps Bay)" value={startSuburb} onChange={(e) => setStartSuburb(e.target.value)} className="flex-1 h-9 text-sm" />
                  <Input placeholder="Destination (e.g. Stellenbosch)" value={destSuburb} onChange={(e) => setDestSuburb(e.target.value)} className="flex-1 h-9 text-sm" />
                  <Button size="sm" onClick={() => setShowRoutes(true)} className="shrink-0">Calculate</Button>
                </div>
                {showRoutes && (
                  <>
                    <div className="space-y-2">
                      {routeOptions.map(r => (
                        <div key={r.name} className="flex items-center gap-3">
                          <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-0.5">
                              <span className="text-xs font-medium text-foreground">{r.name}</span>
                              <span className="text-xs text-muted-foreground">{r.time}</span>
                            </div>
                            <div className="h-2 rounded-full bg-muted overflow-hidden">
                              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${r.safety}%`, backgroundColor: r.safety >= 80 ? 'hsl(var(--safety-green))' : r.safety >= 70 ? 'hsl(var(--safety-yellow))' : 'hsl(var(--safety-orange))' }} />
                            </div>
                          </div>
                          <span className="text-xs font-bold tabular-nums text-foreground w-8 text-right">{r.safety}%</span>
                        </div>
                      ))}
                    </div>
                    <div className="h-32">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={routeRiskProfile}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="km" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
                          <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
                          <Tooltip {...tooltipStyle} />
                          <Line type="monotone" dataKey="risk" name="Risk Score" stroke="hsl(var(--safety-red))" strokeWidth={2} dot={{ r: 3, fill: 'hsl(var(--safety-red))' }} animationDuration={1000} animationEasing="ease-out" animationBegin={0} isAnimationActive={true} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`Almien Safety Route: ${startSuburb} → ${destSuburb}. Safest: ${routeOptions[0].name} (${routeOptions[0].safety}%)`)}`, '_blank')}>
                      <Share2 className="w-3.5 h-3.5 mr-1.5" /> Share via WhatsApp
                    </Button>
                  </>
                )}
                <SAPSFooter quarter={crimeData.quarter} lastSynced={crimeData.lastSynced} />
              </CardContent>
            </Card>

            {/* Safety Prediction */}
            <Card className="bg-card/80 backdrop-blur-sm border-border/50 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
              <CardHeader className="pb-2 px-4 pt-4">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-safety-orange" />
                  Personalised Safety Prediction
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-4">
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input placeholder="From suburb" value={predictorFrom} onChange={(e) => setPredictorFrom(e.target.value)} className="flex-1 h-9 text-sm" />
                  <Input placeholder="To suburb" value={predictorTo} onChange={(e) => setPredictorTo(e.target.value)} className="flex-1 h-9 text-sm" />
                  <Button size="sm" onClick={() => setShowPredictor(true)} className="shrink-0">Predict Risk</Button>
                </div>
                {showPredictor && (
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={predictorOutput}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="hour" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} interval={3} />
                        <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
                        <Tooltip {...tooltipStyle} />
                        <Legend wrapperStyle={{ fontSize: 10 }} />
                        <Area type="monotone" dataKey="predicted" name="Predicted Risk" stroke="hsl(var(--safety-red))" fill="hsl(var(--safety-red))" fillOpacity={0.15} strokeWidth={2} animationDuration={1000} animationEasing="ease-out" animationBegin={0} isAnimationActive={true} />
                        <Area type="monotone" dataKey="historical" name="Historical Avg" stroke="hsl(var(--muted-foreground))" fill="none" strokeWidth={1.5} strokeDasharray="4 4" animationDuration={1000} animationEasing="ease-out" animationBegin={200} isAnimationActive={true} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
                <SAPSFooter quarter={crimeData.quarter} lastSynced={crimeData.lastSynced} />
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── PREDICTIONS ── */}
        {activeTab === 'predictions' && (
          <div className="space-y-4">
            {/* SAPS National KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {crimeData.national.filter(c => c.count > 0).slice(0, 8).map(cat => (
                <Card key={cat.label} className="bg-card/80 backdrop-blur-sm border-border/50 hover:border-primary/30 transition-all duration-300">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground truncate">{cat.label}</span>
                      {cat.changePct !== 0 && (
                        <Badge variant="outline" className={`text-[9px] px-1 py-0 ${cat.changePct < 0 ? 'text-primary border-primary/30' : 'text-destructive border-destructive/30'}`}>
                          {cat.changePct < 0 ? '↓' : '↑'} {Math.abs(cat.changePct)}%
                        </Badge>
                      )}
                    </div>
                    <span className="text-lg font-bold tabular-nums text-foreground">
                      {cat.count.toLocaleString()}
                    </span>
                  </CardContent>
                </Card>
              ))}
              <Card className="bg-card/80 backdrop-blur-sm border-primary/20 hover:border-primary/30 transition-all duration-300 sm:col-span-2 lg:col-span-1">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Total Contact</span>
                    <Badge variant="outline" className="text-[9px] px-1 py-0 text-primary border-primary/30">
                      ↓ {Math.abs(crimeData.totalContactCrimes.changePct)}%
                    </Badge>
                  </div>
                  <span className="text-lg font-bold tabular-nums text-foreground">
                    {crimeData.totalContactCrimes.count.toLocaleString()}
                  </span>
                </CardContent>
              </Card>
            </div>

            {/* GBV Tracker */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                {/* Route Risk Predictor (reused) */}
                <Card className="bg-card/80 backdrop-blur-sm border-border/50 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
                  <CardHeader className="pb-2 px-4 pt-4">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-safety-orange" />
                      Predictive Crime Forecaster
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4">
                    <div className="h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={predictorOutput}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="hour" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} interval={3} />
                          <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
                          <Tooltip {...tooltipStyle} />
                          <Legend wrapperStyle={{ fontSize: 10 }} />
                          <Area type="monotone" dataKey="predicted" name="Predicted Risk" stroke="hsl(var(--safety-red))" fill="hsl(var(--safety-red))" fillOpacity={0.15} strokeWidth={2} animationDuration={1000} animationEasing="ease-out" isAnimationActive={true} />
                          <Area type="monotone" dataKey="historical" name="Historical Avg" stroke="hsl(var(--muted-foreground))" fill="none" strokeWidth={1.5} strokeDasharray="4 4" animationDuration={1000} animationEasing="ease-out" animationBegin={200} isAnimationActive={true} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                    <SAPSFooter quarter={crimeData.quarter} lastSynced={crimeData.lastSynced} />
                  </CardContent>
                </Card>
              </div>
              <GBVTrackerCard />
            </div>
          </div>
        )}

        {/* ── COMMUNITY ── */}
        {activeTab === 'community' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <CitizenReportingCard />
              </div>
              {/* Neighbourhood Watch */}
              <Card className="bg-card/80 backdrop-blur-sm border-border/50 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
                <CardHeader className="pb-2 px-4 pt-4">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" />
                    Community Reports
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Top 5 This Week</p>
                    <div className="space-y-2">
                      {communityIncidents.map(inc => (
                        <div key={inc.type} className="flex items-center gap-3">
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-0.5">
                              <span className="text-xs font-medium text-foreground">{inc.type}</span>
                              <span className="text-xs tabular-nums text-muted-foreground">{inc.count}</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                              <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${(inc.count / communityIncidents[0].count) * 100}%` }} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Precinct Scores</p>
                    <div className="grid grid-cols-3 gap-2">
                      {precinctGauges.map(p => (
                        <div key={p.name} className="text-center">
                          <div className="h-16">
                            <ResponsiveContainer width="100%" height="100%">
                              <RadialBarChart innerRadius="60%" outerRadius="100%" data={[{ value: p.score }]} startAngle={180} endAngle={0} barSize={6}>
                                <PolarAngleAxis type="number" domain={[0, 100]} tick={false} angleAxisId={0} />
                                <RadialBar dataKey="value" cornerRadius={4} fill={p.score >= 70 ? 'hsl(var(--safety-green))' : p.score >= 50 ? 'hsl(var(--safety-yellow))' : 'hsl(var(--safety-red))'} animationDuration={800} animationEasing="ease-out" isAnimationActive={true} />
                              </RadialBarChart>
                            </ResponsiveContainer>
                          </div>
                          <span className="text-[10px] text-muted-foreground leading-tight block">{p.name}</span>
                          <span className="text-xs font-bold tabular-nums text-foreground">{p.score}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <SAPSFooter quarter={crimeData.quarter} lastSynced={crimeData.lastSynced} />
                </CardContent>
              </Card>
            </div>

            {/* Response Leaderboard + SOS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ResponseLeaderboardCard />
              <SOSPanelCard />
            </div>
          </div>
        )}

        {/* ── DIRECTORIES ── */}
        {activeTab === 'directories' && (
          <div className="space-y-4">
            <SafeEducationRetailDirectory />
          </div>
        )}
      </div>

      {/* ═══ Floating SOS ═══ */}
      <FloatingSOS />
    </div>
  );
});

SACrimeLayerView.displayName = 'SACrimeLayerView';
export default SACrimeLayerView;
