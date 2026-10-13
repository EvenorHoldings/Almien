import { memo, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import {
  ThumbsUp, MessageCircle, MapPin, Crown, Lock, Info, Shield, Eye, CheckCircle2,
  Award, Star, Upload, MessageSquare, Zap, Trophy, TrendingUp, Sun, AlertTriangle,
  Phone, Users, ChevronDown, ChevronUp, ExternalLink, Clock, Radio, Bell
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import SafetyPulse from '../SafetyPulse';
import type { ViewId } from '../AlmienDashboard';
import DemoBadge from '@/components/DemoBadge';

interface Props {
  onUpgrade: (trigger?: string) => void;
  onNavigate: (view: ViewId) => void;
}

// ─── TAB SYSTEM ────────────────────────────────────────────
type CommunityTab = 'feed' | 'badges' | 'whatsapp' | 'rewards' | 'briefing';

const tabs: { id: CommunityTab; label: string; icon: typeof Users }[] = [
  { id: 'feed', label: 'Feed', icon: Radio },
  { id: 'badges', label: 'Badges', icon: Shield },
  { id: 'whatsapp', label: 'WhatsApp', icon: MessageSquare },
  { id: 'rewards', label: 'Rewards', icon: Trophy },
  { id: 'briefing', label: 'Briefing', icon: Sun },
];

// ─── BADGE TIERS ───────────────────────────────────────────
const badgeTiers = [
  { id: 'member', label: 'Community Member', desc: 'Default — unverified', weight: 1, color: 'bg-muted text-muted-foreground', icon: '👤' },
  { id: 'nhw', label: 'Neighbourhood Watch', desc: 'CPF or NHW affiliation upload required', weight: 3, color: 'bg-primary/15 text-primary', icon: '🛡️' },
  { id: 'steward', label: 'Block Steward', desc: 'Assigned by a verified CPF captain', weight: 5, color: 'bg-safety-yellow/20 text-safety-yellow', icon: '⭐' },
  { id: 'officer', label: 'Community Safety Officer', desc: 'SAPS or LEAP affiliated — highest trust', weight: 8, color: 'bg-safety-green/20 text-safety-green', icon: '🏅' },
];

// ─── MOCK FEED DATA ────────────────────────────────────────
const feedReports = [
  {
    id: '1', type: 'incident' as const, verified: true, user: '@SafetyWatcher', badge: 'nhw',
    time: '25 min ago', title: 'Vehicle break-in at Sea Point parking', location: 'Sea Point',
    desc: 'Two vehicles broken into in the parking lot near the promenade. Windows smashed, bags stolen.',
    credibility: 82, confirms: 14, comments: 12,
  },
  {
    id: '2', type: 'tip' as const, verified: false, user: '@CapeTownLocal', badge: 'member',
    time: '1 hr ago', title: 'Safe evening walk routes in Green Point', location: 'Green Point',
    desc: 'The promenade from Mouille Point to Green Point is well-lit and busy until about 10pm.',
    credibility: 68, confirms: 38, comments: 8,
  },
  {
    id: '3', type: 'incident' as const, verified: true, user: '@WatchdogCPT', badge: 'steward',
    time: '3 hrs ago', title: 'Pickpocket incident at Greenmarket Square', location: 'City Centre',
    desc: 'Tourist reported phone stolen from pocket while browsing market stalls. Third incident this week.',
    credibility: 91, confirms: 42, comments: 22,
  },
  {
    id: '4', type: 'whatsapp' as const, verified: false, user: 'WhatsApp Group', badge: 'member',
    time: '4 hrs ago', title: 'Suspicious vehicle circling Rondebosch', location: 'Rondebosch',
    desc: 'White Toyota Hilux circling the block near Main Rd. Number plate noted by residents.',
    credibility: 34, confirms: 6, comments: 3,
  },
  {
    id: '5', type: 'incident' as const, verified: true, user: '@OfficerMalan', badge: 'officer',
    time: '6 hrs ago', title: 'Armed robbery — Woodstock petrol station', location: 'Woodstock',
    desc: 'Two suspects robbed the cashier at gunpoint. SAPS responded within 8 minutes. Suspects fled on foot.',
    credibility: 97, confirms: 61, comments: 34,
  },
];

const typeConfig: Record<string, { emoji: string; label: string }> = {
  incident: { emoji: '🔴', label: 'INCIDENT' },
  tip: { emoji: '🟢', label: 'SAFETY TIP' },
  review: { emoji: '🟡', label: 'AREA REVIEW' },
  whatsapp: { emoji: '💬', label: 'WHATSAPP SOURCE — UNVERIFIED' },
};

const badgeIcon: Record<string, string> = {
  member: '👤', nhw: '🛡️', steward: '⭐', officer: '🏅',
};

// ─── LEADERBOARD DATA ──────────────────────────────────────
const leaderboard = [
  { rank: 1, user: '@OfficerMalan', suburb: 'Woodstock', points: 1280, badge: 'officer' },
  { rank: 2, user: '@WatchdogCPT', suburb: 'City Centre', points: 940, badge: 'steward' },
  { rank: 3, user: '@SafetyWatcher', suburb: 'Sea Point', points: 785, badge: 'nhw' },
  { rank: 4, user: '@CapeTownLocal', suburb: 'Green Point', points: 420, badge: 'member' },
  { rank: 5, user: '@MountainRunner', suburb: 'Camps Bay', points: 310, badge: 'member' },
];

// ─── BRIEFING DATA ─────────────────────────────────────────
const briefing = {
  date: 'Today — ' + new Date().toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long' }),
  suburb: 'Sea Point',
  threatLevel: 'Moderate' as const,
  summary: [
    { label: 'Vehicle break-ins', count: 3, trend: 'up' as const },
    { label: 'Robberies', count: 1, trend: 'stable' as const },
    { label: 'Suspicious activity reports', count: 7, trend: 'down' as const },
  ],
  advisories: [
    'Load-shedding Stage 4 expected tonight 20:00–22:30',
    'Cape Town Marathon road closures near Sea Point promenade (Sunday)',
    'SAPS anti-crime operation active in CBD through weekend',
  ],
  tips: [
    'Avoid parking in unlit side streets — use secured parking lots after 18:00',
    'Walk in groups along the promenade after dark',
    'Keep car windows closed and doors locked at traffic lights',
  ],
};

const threatColors = {
  Low: 'text-safety-green bg-safety-green/15',
  Moderate: 'text-safety-yellow bg-safety-yellow/15',
  High: 'text-safety-orange bg-safety-orange/15',
  Critical: 'text-safety-red bg-safety-red/15',
};

// ─── COMPONENT ─────────────────────────────────────────────
const CommunityIntelView = memo(({ onUpgrade }: Props) => {
  const [activeTab, setActiveTab] = useState<CommunityTab>('feed');
  const [filter, setFilter] = useState('All');
  const [confirmed, setConfirmed] = useState<Set<string>>(new Set());
  const [radius, setRadius] = useState(5);
  const [whatsappConnected, setWhatsappConnected] = useState(false);
  const [expandedReport, setExpandedReport] = useState<string | null>(null);

  const handleConfirm = useCallback((id: string) => {
    setConfirmed(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
    toast.success('Confirmation recorded — credibility weight updated');
  }, []);

  const filters = ['All', 'Incidents', 'Tips', 'WhatsApp', 'Verified ✓'];

  const filteredReports = feedReports.filter(r => {
    if (filter === 'All') return true;
    if (filter === 'Incidents') return r.type === 'incident';
    if (filter === 'Tips') return r.type === 'tip';
    if (filter === 'WhatsApp') return r.type === 'whatsapp';
    if (filter === 'Verified ✓') return r.verified;
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Community Intelligence Mesh <DemoBadge className="ml-2 align-middle" /></h1>
        <p className="text-muted-foreground mt-1">Crowdsourced safety intelligence from your neighbourhood</p>
      </div>

      {/* Tab Bar */}
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

      {/* ─── TAB: COMMUNITY FEED ─────────────────────────── */}
      {activeTab === 'feed' && (
        <div className="space-y-5">
          <SafetyPulse />

          {/* Radius Control */}
          <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
            <span className="text-sm text-muted-foreground">Feed radius</span>
            <div className="flex items-center gap-2">
              {[2, 5, 10, 25].map(r => (
                <button
                  key={r}
                  onClick={() => setRadius(r)}
                  className={cn(
                    "px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
                    radius === r ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
                  )}
                >
                  {r}km
                </button>
              ))}
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            {filters.map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                  filter === f ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
                )}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Reports */}
          <div className="space-y-4">
            {filteredReports.map(report => {
              const config = typeConfig[report.type] || typeConfig.incident;
              const isConfirmed = confirmed.has(report.id);
              const isExpanded = expandedReport === report.id;
              return (
                <div key={report.id} className={cn(
                  "p-5 rounded-xl border bg-card transition-all",
                  report.type === 'whatsapp' ? "border-safety-yellow/30" : "border-border"
                )}>
                  {/* Header row */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{config.emoji} {config.label}</span>
                      {report.verified && <span className="text-safety-green font-semibold">VERIFIED ✓</span>}
                    </div>
                    <span className="text-[11px] text-muted-foreground">{report.time}</span>
                  </div>

                  {/* Reporter + Badge */}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                    <span>{badgeIcon[report.badge]}</span>
                    <span className="font-medium">{report.user}</span>
                    <Badge variant="outline" className="text-[10px] py-0 px-1.5">
                      {badgeTiers.find(b => b.id === report.badge)?.label}
                    </Badge>
                  </div>

                  <h3 className="text-base font-semibold text-foreground mb-1">{report.title}</h3>
                  <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {report.location}
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{report.desc}</p>

                  {/* AI Credibility Bar */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] text-muted-foreground font-medium">AI Credibility Score</span>
                      <span className={cn(
                        "text-xs font-bold",
                        report.credibility >= 80 ? "text-safety-green" :
                        report.credibility >= 50 ? "text-safety-yellow" : "text-safety-red"
                      )}>
                        {report.credibility}%
                      </span>
                    </div>
                    <Progress
                      value={report.credibility}
                      className="h-2"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                    <button
                      onClick={() => handleConfirm(report.id)}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all border",
                        isConfirmed
                          ? "bg-primary/15 text-primary border-primary/30"
                          : "border-border hover:border-primary/30 hover:text-foreground"
                      )}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {isConfirmed ? 'Confirmed' : 'I saw this too'}
                      <span className="text-muted-foreground">({report.confirms + (isConfirmed ? 1 : 0)})</span>
                    </button>
                    <span className="flex items-center gap-1"><ThumbsUp className="w-3 h-3" /> {report.confirms} confirms</span>
                    <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" /> {report.comments}</span>
                    <button
                      onClick={() => setExpandedReport(isExpanded ? null : report.id)}
                      className="ml-auto flex items-center gap-1 text-primary hover:underline"
                    >
                      Details {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-border text-xs text-muted-foreground space-y-1">
                      <p>📍 Suburb-level location shown for reporter privacy</p>
                      <p>🤖 Credibility weighted by: badge tier ({badgeTiers.find(b => b.id === report.badge)?.label}), confirmation count, cross-reference with SAPS data</p>
                      {report.type === 'whatsapp' && <p>💬 Sourced from community WhatsApp group — auto-ingested, low confidence</p>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <button className="w-full py-3 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:bg-secondary transition-colors">
            Load More
          </button>
        </div>
      )}

      {/* ─── TAB: REPORTER BADGE SYSTEM ──────────────────── */}
      {activeTab === 'badges' && (
        <div className="space-y-5">
          <div className="p-4 rounded-xl border border-border bg-card">
            <h2 className="font-bold text-foreground mb-1">Your Badge</h2>
            <div className="flex items-center gap-3 mt-3 p-3 rounded-lg bg-secondary/50">
              <span className="text-2xl">👤</span>
              <div>
                <p className="font-semibold text-foreground">Community Member</p>
                <p className="text-xs text-muted-foreground">Default tier — submit reports to build reputation</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="font-bold text-foreground">Badge Tiers</h2>
            {badgeTiers.map((tier, i) => (
              <div key={tier.id} className="p-4 rounded-xl border border-border bg-card">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xl">{tier.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground">{tier.label}</h3>
                      <Badge variant="outline" className="text-[10px]">Weight ×{tier.weight}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{tier.desc}</p>
                  </div>
                </div>
                {i > 0 && (
                  <button
                    onClick={() => {
                      if (tier.id === 'nhw') {
                        toast.info('Upload your CPF/NHW affiliation document to apply for Neighbourhood Watch badge');
                      } else if (tier.id === 'steward') {
                        toast.info('Block Steward status is assigned by a verified CPF captain');
                      } else {
                        toast.info('Contact your SAPS or LEAP coordinator to apply');
                      }
                    }}
                    className="mt-2 text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                  >
                    {tier.id === 'nhw' ? <><Upload className="w-3 h-3" /> Apply — Upload Document</> :
                     tier.id === 'steward' ? <><Users className="w-3 h-3" /> Request from CPF Captain</> :
                     <><Shield className="w-3 h-3" /> Apply via SAPS/LEAP</>}
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="p-4 rounded-xl border border-border bg-card">
            <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
              <Info className="w-4 h-4 text-primary" /> How Badge Weight Works
            </h3>
            <p className="text-sm text-muted-foreground">
              Higher badge tiers give your reports a greater AI credibility weight. A Community Safety Officer's report
              starts at 8× base credibility, while a Community Member starts at 1×. Credibility also increases when
              others confirm your reports.
            </p>
          </div>
        </div>
      )}

      {/* ─── TAB: WHATSAPP INTEGRATION ───────────────────── */}
      {activeTab === 'whatsapp' && (
        <div className="space-y-5">
          <div className="p-5 rounded-xl border border-border bg-card">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-safety-green/15 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-safety-green" />
              </div>
              <div>
                <h2 className="font-bold text-foreground">WhatsApp Group Integration</h2>
                <p className="text-xs text-muted-foreground">Connect your community safety WhatsApp group</p>
              </div>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                <div>
                  <p className="text-sm font-medium text-foreground">Connection Status</p>
                  <p className="text-xs text-muted-foreground">
                    {whatsappConnected ? 'Active — monitoring for safety keywords' : 'Not connected'}
                  </p>
                </div>
                <Switch
                  checked={whatsappConnected}
                  onCheckedChange={(v) => {
                    setWhatsappConnected(v);
                    toast.success(v ? 'WhatsApp group connected — monitoring started' : 'WhatsApp group disconnected');
                  }}
                />
              </div>
            </div>

            <div className="p-3 rounded-lg bg-accent text-sm text-muted-foreground mb-4">
              <p className="font-semibold text-foreground mb-1">How it works:</p>
              <ol className="list-decimal list-inside space-y-1 text-xs">
                <li>Add Almien as an admin to your community WhatsApp group</li>
                <li>Almien passively monitors for safety keywords</li>
                <li>Matching messages appear on the map as "WhatsApp Source — Unverified"</li>
                <li>You can revoke access at any time</li>
              </ol>
            </div>

            <div className="p-3 rounded-lg border border-border">
              <p className="text-xs font-semibold text-muted-foreground mb-2">MONITORED KEYWORDS</p>
              <div className="flex flex-wrap gap-1.5">
                {['hijacking', 'robbery', 'shooting', 'gunshots', 'suspicious', 'be careful', 'crime', 'police'].map(kw => (
                  <Badge key={kw} variant="secondary" className="text-xs">{kw}</Badge>
                ))}
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-destructive/30 bg-destructive/5">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              <h3 className="font-semibold text-foreground text-sm">Privacy Notice</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Almien only processes messages containing safety-related keywords. Personal messages are never stored.
              All ingested data is anonymised — no phone numbers or personal identifiers are captured.
              You must explicitly authorise this connection and can revoke it at any time.
            </p>
          </div>

          {whatsappConnected && (
            <div className="p-4 rounded-xl border border-border bg-card">
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" /> Recent WhatsApp Ingestions
              </h3>
              {[
                { time: '4 hrs ago', msg: '"Suspicious vehicle circling block near Main Rd Rondebosch"', keyword: 'suspicious' },
                { time: '8 hrs ago', msg: '"Be careful — reports of phone snatching at Wynberg station"', keyword: 'be careful' },
                { time: '12 hrs ago', msg: '"Police presence heavy on N2 near airport — crime scene"', keyword: 'police' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3 py-2 border-b border-border last:border-0">
                  <Badge variant="secondary" className="text-[10px] shrink-0 mt-0.5">{item.keyword}</Badge>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground truncate">{item.msg}</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-0.5">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── TAB: REWARDS & LEADERBOARD ──────────────────── */}
      {activeTab === 'rewards' && (
        <div className="space-y-5">
          {/* Points Summary */}
          <div className="p-5 rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-bold text-foreground">Your Almien Points</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Earn points for keeping your community safe</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-extrabold text-primary">125</p>
                <p className="text-[10px] text-muted-foreground">POINTS</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Verified Report', pts: '+10', icon: Eye, desc: 'Submit a verified report' },
                { label: '3+ Confirms', pts: '+25', icon: CheckCircle2, desc: 'Report confirmed by 3+ users' },
                { label: 'Steward Response', pts: '+50', icon: Shield, desc: 'Respond to a panic event' },
              ].map(item => (
                <div key={item.label} className="p-3 rounded-lg border border-border text-center">
                  <item.icon className="w-5 h-5 mx-auto text-primary mb-1" />
                  <p className="text-lg font-bold text-foreground">{item.pts}</p>
                  <p className="text-[10px] text-muted-foreground">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Leaderboard */}
          <div className="p-5 rounded-xl border border-border bg-card">
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="w-5 h-5 text-primary" />
              <h2 className="font-bold text-foreground">Monthly Safety Leaderboard</h2>
            </div>
            <div className="space-y-2">
              {leaderboard.map(entry => (
                <div key={entry.rank} className={cn(
                  "flex items-center gap-3 p-3 rounded-lg",
                  entry.rank === 1 ? "bg-primary/10 border border-primary/20" : "bg-secondary/30"
                )}>
                  <span className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                    entry.rank === 1 ? "bg-primary text-primary-foreground" :
                    entry.rank === 2 ? "bg-muted-foreground/20 text-foreground" :
                    "bg-muted text-muted-foreground"
                  )}>
                    {entry.rank}
                  </span>
                  <span className="text-sm">{badgeIcon[entry.badge]}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{entry.user}</p>
                    <p className="text-[10px] text-muted-foreground">{entry.suburb}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-primary">{entry.points.toLocaleString()}</p>
                    <p className="text-[10px] text-muted-foreground">pts</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Future Rewards */}
          <div className="p-4 rounded-xl border border-border bg-card">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-foreground">Coming Soon: Reward Redemptions</h3>
            </div>
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              <li className="flex items-center gap-2"><Crown className="w-3 h-3 text-primary shrink-0" /> Data vouchers from partner networks</li>
              <li className="flex items-center gap-2"><Crown className="w-3 h-3 text-primary shrink-0" /> Discounts at local businesses</li>
              <li className="flex items-center gap-2"><Crown className="w-3 h-3 text-primary shrink-0" /> Priority access to Elite features</li>
            </ul>
          </div>
        </div>
      )}

      {/* ─── TAB: NEIGHBOURHOOD BRIEFING ─────────────────── */}
      {activeTab === 'briefing' && (
        <div className="space-y-5">
          <div className="p-5 rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-bold text-foreground">Daily Safety Briefing</h2>
                <p className="text-xs text-muted-foreground">{briefing.date}</p>
              </div>
              <Badge className={cn("text-xs font-bold", threatColors[briefing.threatLevel])}>
                {briefing.threatLevel} Threat
              </Badge>
            </div>

            <div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-accent text-xs text-muted-foreground">
              <Sun className="w-4 h-4 text-primary shrink-0" />
              <span>AI-generated for <strong className="text-foreground">{briefing.suburb}</strong> — pushed daily at 06:30</span>
            </div>

            {/* Incident Summary */}
            <h3 className="text-sm font-semibold text-foreground mb-2">Yesterday's Incidents</h3>
            <div className="space-y-2 mb-5">
              {briefing.summary.map(item => (
                <div key={item.label} className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/30">
                  <span className="text-sm text-foreground">{item.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-foreground">{item.count}</span>
                    <TrendingUp className={cn(
                      "w-3.5 h-3.5",
                      item.trend === 'up' ? "text-safety-red" :
                      item.trend === 'down' ? "text-safety-green rotate-180" :
                      "text-muted-foreground"
                    )} />
                  </div>
                </div>
              ))}
            </div>

            {/* Advisories */}
            <h3 className="text-sm font-semibold text-foreground mb-2">⚠️ Active Advisories</h3>
            <div className="space-y-2 mb-5">
              {briefing.advisories.map((adv, i) => (
                <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-safety-yellow/10 text-xs text-foreground">
                  <AlertTriangle className="w-3.5 h-3.5 text-safety-yellow shrink-0 mt-0.5" />
                  {adv}
                </div>
              ))}
            </div>

            {/* Tips */}
            <h3 className="text-sm font-semibold text-foreground mb-2">🛡️ Safety Tips for Today</h3>
            <div className="space-y-2">
              {briefing.tips.map((tip, i) => (
                <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-primary/5 text-xs text-foreground">
                  <Shield className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                  {tip}
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-xl border border-border bg-card">
            <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
              <Bell className="w-4 h-4 text-primary" /> Notification Settings
            </h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground">Daily briefing push notification</p>
                <p className="text-xs text-muted-foreground">Delivered at 06:30 every morning</p>
              </div>
              <Switch defaultChecked />
            </div>
          </div>
        </div>
      )}

      {/* Elite CTA — shown on all tabs */}
      <div className="p-6 rounded-xl border border-border bg-card">
        <div className="flex items-center gap-2 mb-3">
          <Lock className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-foreground">Elite Community Features</h3>
        </div>
        <ul className="space-y-1.5 mb-4">
          {['Create and post new reports', 'Comment and upvote reports', 'WhatsApp group auto-ingestion', 'Earn and redeem Almien Points', 'Daily AI briefing notifications'].map(f => (
            <li key={f} className="text-sm text-muted-foreground flex items-center gap-2">
              <Crown className="w-3 h-3 text-primary shrink-0" /> {f}
            </li>
          ))}
        </ul>
        <button onClick={() => onUpgrade()} className="text-sm font-semibold text-primary hover:underline">Upgrade to Elite →</button>
      </div>
    </div>
  );
});

CommunityIntelView.displayName = 'CommunityIntelView';
export default CommunityIntelView;
