import { useState, useCallback, memo } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Heart, MapPin, Phone, Shield, AlertTriangle, ChevronDown, ChevronUp,
  Clock, ExternalLink, Siren, Users, Scale, BookOpen, Building2, Search
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import type { ViewId } from '../AlmienDashboard';
import DemoBadge from '@/components/DemoBadge';

interface Props {
  onUpgrade: (trigger?: string) => void;
  onNavigate: (view: ViewId) => void;
}

type SafeSpaceTab = 'heatmap' | 'shelters' | 'legal' | 'resources';
type GBVFilter = 'domestic' | 'sexual-assault' | 'stalking' | 'child-abuse';

// ── Mock Data ──────────────────────────────────────────────────────────

const gbvHeatmapZones = [
  { area: 'Khayelitsha', domestic: 42, sexual: 18, stalking: 12, child: 8, severity: 'critical' as const },
  { area: 'Mitchells Plain', domestic: 38, sexual: 15, stalking: 9, child: 11, severity: 'critical' as const },
  { area: 'Nyanga', domestic: 35, sexual: 22, stalking: 7, child: 6, severity: 'critical' as const },
  { area: 'Gugulethu', domestic: 28, sexual: 12, stalking: 8, child: 5, severity: 'high' as const },
  { area: 'Delft', domestic: 25, sexual: 10, stalking: 6, child: 7, severity: 'high' as const },
  { area: 'Manenberg', domestic: 22, sexual: 9, stalking: 5, child: 4, severity: 'high' as const },
  { area: 'Philippi', domestic: 20, sexual: 11, stalking: 4, child: 3, severity: 'moderate' as const },
  { area: 'Lavender Hill', domestic: 18, sexual: 8, stalking: 6, child: 5, severity: 'moderate' as const },
  { area: 'Langa', domestic: 15, sexual: 6, stalking: 3, child: 2, severity: 'moderate' as const },
  { area: 'Elsies River', domestic: 12, sexual: 5, stalking: 4, child: 3, severity: 'low' as const },
];

const shelters = [
  { name: 'Rape Crisis Cape Town Trust', address: '23 Trill Road, Observatory', distance: '3.2 km', beds: 'Call to Confirm' as const, hours: '24/7 Helpline', phone: '0214479762', type: 'Crisis Centre' },
  { name: 'TEARS Foundation', address: 'National Helpline', distance: '—', beds: 'Available' as const, hours: '24/7', phone: '0800428428', type: 'Helpline & Support' },
  { name: 'Saartjie Baartman Centre for Women', address: 'Klipfontein Rd, Manenberg', distance: '8.1 km', beds: 'Available' as const, hours: '24/7', phone: '0216330300', type: 'Shelter' },
  { name: 'POWA — People Opposing Women Abuse', address: 'National Service', distance: '—', beds: 'Call to Confirm' as const, hours: 'Mon–Fri 08:00–16:30', phone: '0116424345', type: 'Legal & Support' },
  { name: 'Lifeline Southern Africa', address: 'National Helpline', distance: '—', beds: 'Available' as const, hours: '24/7', phone: '0861322322', type: 'Counselling' },
  { name: 'Mosaic Training Centre', address: '5 Wynberg Rd, Wynberg', distance: '6.4 km', beds: 'Available' as const, hours: 'Mon–Fri 08:00–17:00', phone: '0217617585', type: 'Training & Support' },
  { name: 'Cape Flats Women\'s Forum', address: 'Mitchells Plain', distance: '12.3 km', beds: 'Call to Confirm' as const, hours: 'Mon–Fri 09:00–16:00', phone: '0213701144', type: 'Community Support' },
  { name: 'St Anne\'s Home', address: 'Woodstock', distance: '4.1 km', beds: 'Full' as const, hours: '24/7', phone: '0214484546', type: 'Shelter' },
];

const legalResources = [
  {
    title: 'How to Apply for a Protection Order',
    content: 'Visit your nearest Magistrate Court with your ID. You can apply for an Interim Protection Order free of charge. The court will set a return date where the respondent must appear. No lawyer is needed — the clerk of the court will assist you.',
  },
  {
    title: 'SAPS Family Violence Units',
    items: [
      { name: 'Cape Town Central FCS', phone: '0214672451' },
      { name: 'Khayelitsha FCS', phone: '0213610900' },
      { name: 'Mitchells Plain FCS', phone: '0213704000' },
      { name: 'Bellville FCS', phone: '0219408000' },
      { name: 'Wynberg FCS', phone: '0217998134' },
    ],
  },
  {
    title: 'Legal Aid South Africa',
    content: 'Free legal representation for qualifying individuals. Call 0800 110 110 or visit your nearest Legal Aid office. You do NOT need money to access legal help.',
    phone: '0800110110',
  },
];

const rightsGuide = [
  'You have the right to lay a charge at ANY police station — the police MUST assist you.',
  'You can obtain a Protection Order without a lawyer, free of charge.',
  'The police must provide you with a case number and a medical examination form (J88).',
  'You have the right to be treated with dignity and without judgement.',
  'You can request to be interviewed by a female officer.',
  'You do NOT have to go back to an abusive situation — ask about shelters.',
  'Children can report abuse directly to the police or a social worker.',
  'Sexual offences have NO prescription period — you can report at any time.',
];

// ── Severity styles using accent-gbv token ─────────────────────────────

const severityStyles = {
  critical: { bg: 'bg-accent-gbv/20', border: 'border-accent-gbv/40', text: 'text-accent-gbv', dot: 'bg-accent-gbv' },
  high: { bg: 'bg-accent-gbv/15', border: 'border-accent-gbv/30', text: 'text-accent-gbv', dot: 'bg-accent-gbv/80' },
  moderate: { bg: 'bg-accent-gbv/10', border: 'border-accent-gbv/20', text: 'text-accent-gbv/80', dot: 'bg-accent-gbv/60' },
  low: { bg: 'bg-accent-gbv/5', border: 'border-accent-gbv/15', text: 'text-accent-gbv/70', dot: 'bg-accent-gbv/40' },
};

const bedsBadge = {
  'Available': 'bg-accent-safe/15 text-accent-safe border-accent-safe/30',
  'Full': 'bg-accent-threat/15 text-accent-threat border-accent-threat/30',
  'Call to Confirm': 'bg-accent-warning/15 text-accent-warning border-accent-warning/30',
};

// ── Component ──────────────────────────────────────────────────────────

const SafeSpaceView = memo((_props: Props) => {
  const [tab, setTab] = useState<SafeSpaceTab>('heatmap');
  const [filters, setFilters] = useState<Set<GBVFilter>>(new Set(['domestic', 'sexual-assault', 'stalking', 'child-abuse']));
  const [shelterSearch, setShelterSearch] = useState('');
  const [expandedLegal, setExpandedLegal] = useState<string | null>(null);

  const toggleFilter = useCallback((f: GBVFilter) => {
    setFilters(prev => {
      const next = new Set(prev);
      if (next.has(f)) next.delete(f); else next.add(f);
      return next;
    });
  }, []);

  const triggerGBVPanic = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          const msg = `🆘 GBV EMERGENCY — I need help. Location: https://maps.google.com/?q=${latitude},${longitude}`;
          navigator.clipboard.writeText(msg).catch(() => {});
          toast.error('GBV Panic Alert sent to Trusted Network', { duration: 6000 });
        },
        () => toast.error('GBV Panic Alert activated — could not get location', { duration: 5000 })
      );
    }
    window.open('tel:0800428428', '_self');
  }, []);

  const filteredShelters = shelters.filter(s =>
    s.name.toLowerCase().includes(shelterSearch.toLowerCase()) ||
    s.type.toLowerCase().includes(shelterSearch.toLowerCase())
  );

  const tabs: { id: SafeSpaceTab; label: string; icon: typeof Heart }[] = [
    { id: 'heatmap', label: 'GBV Heat Map', icon: MapPin },
    { id: 'shelters', label: 'Shelters', icon: Building2 },
    { id: 'legal', label: 'Legal Aid', icon: Scale },
    { id: 'resources', label: 'Your Rights', icon: BookOpen },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header — accent-gbv themed */}
      <div className="p-6 rounded-2xl bg-accent-gbv/10 border border-accent-gbv/20">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-accent-gbv/20 flex items-center justify-center">
            <Heart className="w-5 h-5 text-accent-gbv" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Safe Space <DemoBadge className="ml-2 align-middle" /></h1>
            <p className="text-sm text-muted-foreground">GBV & Femicide Intelligence · Confidential · You are not alone</p>
          </div>
        </div>

        {/* GBV Panic Button — accent-gbv primary CTA */}
        <Button
          className="w-full h-14 text-base font-bold mt-4 rounded-xl bg-accent-gbv hover:bg-accent-gbv/90 text-surface-deep"
          onClick={triggerGBVPanic}
        >
          <Siren className="w-5 h-5 mr-2" />
          GBV EMERGENCY — Call TEARS & Alert Contacts
        </Button>
        <p className="text-[10px] text-center text-muted-foreground mt-2">
          Connects to TEARS Foundation (0800 428 428) and sends your location to your Safety Network
        </p>
      </div>

      {/* Tab bar — accent-gbv active state */}
      <div className="flex gap-1 p-1 rounded-xl bg-secondary/50 border border-border-subtle overflow-x-auto">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all",
              tab === t.id
                ? "bg-accent-gbv/20 text-accent-gbv border border-accent-gbv/30"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {/* ═══ TAB: GBV HEAT MAP ═══ */}
      {tab === 'heatmap' && (
        <div className="space-y-4 animate-fade-in">
          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            {([
              { id: 'domestic' as GBVFilter, label: 'Domestic Violence' },
              { id: 'sexual-assault' as GBVFilter, label: 'Sexual Assault' },
              { id: 'stalking' as GBVFilter, label: 'Stalking / Harassment' },
              { id: 'child-abuse' as GBVFilter, label: 'Child Abuse' },
            ]).map(f => (
              <button
                key={f.id}
                onClick={() => toggleFilter(f.id)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-all border",
                  filters.has(f.id)
                    ? "bg-accent-gbv/20 text-accent-gbv border-accent-gbv/30"
                    : "bg-secondary/50 text-muted-foreground border-border-subtle hover:text-foreground"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Simulated heatmap grid */}
          <div className="rounded-xl border border-accent-gbv/20 overflow-hidden bg-secondary/30 p-4">
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-1">
              {Array.from({ length: 50 }).map((_, i) => {
                const intensity = Math.random();
                const alpha = intensity < 0.3 ? '10' : intensity < 0.6 ? '25' : intensity < 0.85 ? '40' : '60';
                return (
                  <div
                    key={i}
                    className={cn(
                      "aspect-square rounded-sm transition-all duration-500",
                      intensity > 0.85 && "animate-pulse"
                    )}
                    style={{ backgroundColor: `hsl(270 95% 75% / 0.${alpha})` }}
                  />
                );
              })}
            </div>
            <div className="flex items-center justify-between mt-3 px-1">
              <span className="text-[10px] text-muted-foreground">Low Density</span>
              <div className="flex gap-1">
                {['20', '35', '50', '70'].map(a => (
                  <div key={a} className="w-4 h-2 rounded-sm" style={{ backgroundColor: `hsl(270 95% 75% / 0.${a})` }} />
                ))}
              </div>
              <span className="text-[10px] text-muted-foreground">Critical</span>
            </div>
          </div>

          {/* Precinct list */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-foreground">Highest-Risk Areas — GBV Reports (30 days)</h3>
            {gbvHeatmapZones.map(zone => {
              const s = severityStyles[zone.severity];
              const total = (filters.has('domestic') ? zone.domestic : 0)
                + (filters.has('sexual-assault') ? zone.sexual : 0)
                + (filters.has('stalking') ? zone.stalking : 0)
                + (filters.has('child-abuse') ? zone.child : 0);
              if (total === 0) return null;
              return (
                <div key={zone.area} className={cn("p-3 rounded-xl border", s.bg, s.border)}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={cn("w-2 h-2 rounded-full", s.dot)} />
                      <span className="text-sm font-semibold text-foreground">{zone.area}</span>
                    </div>
                    <Badge variant="outline" className={cn("text-[10px] border", s.border, s.text)}>
                      {total} reports
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
                    {filters.has('domestic') && (
                      <span className="text-muted-foreground">Domestic: <strong className="text-foreground">{zone.domestic}</strong></span>
                    )}
                    {filters.has('sexual-assault') && (
                      <span className="text-muted-foreground">Sexual: <strong className="text-foreground">{zone.sexual}</strong></span>
                    )}
                    {filters.has('stalking') && (
                      <span className="text-muted-foreground">Stalking: <strong className="text-foreground">{zone.stalking}</strong></span>
                    )}
                    {filters.has('child-abuse') && (
                      <span className="text-muted-foreground">Child: <strong className="text-foreground">{zone.child}</strong></span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══ TAB: SHELTERS ═══ */}
      {tab === 'shelters' && (
        <div className="space-y-4 animate-fade-in">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search shelters, crisis centres..."
              value={shelterSearch}
              onChange={e => setShelterSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {filteredShelters.length === 0 && (
            <div className="text-center py-8">
              <Building2 className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No results found. Try a different search.</p>
            </div>
          )}

          <div className="space-y-3">
            {filteredShelters.map(s => (
              <div key={s.name} className="p-4 rounded-xl border border-accent-gbv/15 bg-accent-gbv/5 hover:border-accent-gbv/30 transition-all">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="text-sm font-bold text-foreground">{s.name}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">{s.type}</p>
                  </div>
                  <Badge variant="outline" className={cn("text-[10px] border", bedsBadge[s.beds])}>
                    {s.beds}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted-foreground mb-3">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3 h-3 shrink-0" /> {s.address}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3 h-3 shrink-0" /> {s.hours}
                  </span>
                  {s.distance !== '—' && (
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3 h-3 shrink-0" /> {s.distance} away
                    </span>
                  )}
                </div>

                <Button
                  size="sm"
                  className="w-full bg-accent-gbv hover:bg-accent-gbv/90 text-surface-deep text-xs"
                  asChild
                >
                  <a href={`tel:${s.phone}`}>
                    <Phone className="w-3.5 h-3.5 mr-1.5" /> Call Now — {s.phone}
                  </a>
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ TAB: LEGAL AID ═══ */}
      {tab === 'legal' && (
        <div className="space-y-4 animate-fade-in">
          {legalResources.map(res => (
            <div key={res.title} className="p-4 rounded-xl border border-accent-gbv/15 bg-accent-gbv/5">
              <button
                className="w-full flex items-center justify-between text-left"
                onClick={() => setExpandedLegal(expandedLegal === res.title ? null : res.title)}
              >
                <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Scale className="w-4 h-4 text-accent-gbv" />
                  {res.title}
                </h4>
                {expandedLegal === res.title
                  ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  : <ChevronDown className="w-4 h-4 text-muted-foreground" />
                }
              </button>

              {expandedLegal === res.title && (
                <div className="mt-3 space-y-2 animate-fade-in">
                  {res.content && (
                    <p className="text-xs text-muted-foreground leading-relaxed">{res.content}</p>
                  )}
                  {res.items && (
                    <div className="space-y-1.5">
                      {res.items.map(item => (
                        <div key={item.name} className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/50">
                          <span className="text-xs font-medium text-foreground">{item.name}</span>
                          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-accent-gbv" asChild>
                            <a href={`tel:${item.phone}`}><Phone className="w-3 h-3 mr-1" /> {item.phone}</a>
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  {res.phone && (
                    <Button size="sm" className="w-full bg-accent-gbv hover:bg-accent-gbv/90 text-surface-deep text-xs mt-2" asChild>
                      <a href={`tel:${res.phone}`}>
                        <Phone className="w-3.5 h-3.5 mr-1.5" /> Call {res.phone}
                      </a>
                    </Button>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Nearest Magistrate Courts */}
          <div className="p-4 rounded-xl border border-accent-gbv/15 bg-accent-gbv/5">
            <h4 className="text-sm font-bold text-foreground flex items-center gap-2 mb-3">
              <Building2 className="w-4 h-4 text-accent-gbv" />
              Nearest Magistrate Courts
            </h4>
            <div className="space-y-2">
              {[
                { name: 'Cape Town Magistrate Court', address: 'Corporation St, Cape Town' },
                { name: 'Wynberg Magistrate Court', address: 'Church St, Wynberg' },
                { name: 'Mitchells Plain Magistrate Court', address: 'AZ Berman Dr' },
                { name: 'Khayelitsha Magistrate Court', address: 'Steve Biko Rd' },
              ].map(c => (
                <div key={c.name} className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/50">
                  <div>
                    <p className="text-xs font-medium text-foreground">{c.name}</p>
                    <p className="text-[10px] text-muted-foreground">{c.address}</p>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══ TAB: YOUR RIGHTS ═══ */}
      {tab === 'resources' && (
        <div className="space-y-4 animate-fade-in">
          <div className="p-5 rounded-xl border border-accent-gbv/20 bg-accent-gbv/10">
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2 mb-4">
              <BookOpen className="w-5 h-5 text-accent-gbv" />
              What Are My Rights?
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              Under the Domestic Violence Act (Act 116 of 1998) and the Sexual Offences Act, you are protected. Here is what you need to know:
            </p>
            <div className="space-y-2">
              {rightsGuide.map((right, i) => (
                <div key={i} className="flex items-start gap-2.5 p-3 rounded-lg bg-card border border-border-subtle">
                  <Shield className="w-4 h-4 text-accent-gbv mt-0.5 shrink-0" />
                  <p className="text-xs text-foreground leading-relaxed">{right}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Quick links */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { name: 'TEARS Foundation', phone: '0800 428 428', tel: '0800428428' },
              { name: 'GBV Command Centre', phone: '0800 150 150', tel: '0800150150' },
              { name: 'Childline South Africa', phone: '0800 055 555', tel: '0800055555' },
              { name: 'SAPS Emergency', phone: '10111', tel: '10111' },
            ].map(link => (
              <Button key={link.tel} variant="outline" className="h-auto py-4 justify-start border-accent-gbv/20 hover:bg-accent-gbv/5" asChild>
                <a href={`tel:${link.tel}`}>
                  <Phone className="w-4 h-4 text-accent-gbv mr-3 shrink-0" />
                  <div className="text-left">
                    <p className="text-xs font-bold text-foreground">{link.name}</p>
                    <p className="text-[10px] text-muted-foreground">{link.phone} — 24/7</p>
                  </div>
                </a>
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="text-center pt-4 border-t border-accent-gbv/10">
        <p className="text-[10px] text-muted-foreground">
          Safe Space by Almien · All information is confidential · If you are in immediate danger, call 10111
        </p>
      </div>
    </div>
  );
});

SafeSpaceView.displayName = 'SafeSpaceView';
export default SafeSpaceView;
