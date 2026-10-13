import { Link } from 'react-router-dom';
import { memo, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { 
  User, Shield, Bell, CreditCard, HelpCircle, Info, Crown, Lock, MessageSquare, EyeOff,
  Download, WifiOff, Zap, FileText, Phone, CheckCircle2, RefreshCw, Smartphone, Database,
  Contrast
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import type { ViewId } from '../AlmienDashboard';
import DemoBadge from '@/components/DemoBadge';

interface Props {
  onUpgrade: (trigger?: string) => void;
  onNavigate: (view: ViewId) => void;
}

// Offline map pack mock data
const suburbPacks = [
  { id: 'rondebosch', name: 'Rondebosch', size: '4.2 MB', lastUpdated: '08 Mar 2026, 06:30', downloaded: true },
  { id: 'claremont', name: 'Claremont', size: '3.8 MB', lastUpdated: '08 Mar 2026, 06:30', downloaded: true },
  { id: 'wynberg', name: 'Wynberg', size: '5.1 MB', lastUpdated: '07 Mar 2026, 22:15', downloaded: false },
  { id: 'observatory', name: 'Observatory', size: '2.9 MB', lastUpdated: '08 Mar 2026, 06:30', downloaded: false },
  { id: 'woodstock', name: 'Woodstock', size: '3.4 MB', lastUpdated: '07 Mar 2026, 18:00', downloaded: false },
  { id: 'mowbray', name: 'Mowbray', size: '2.7 MB', lastUpdated: '08 Mar 2026, 06:30', downloaded: false },
];

const SettingsView = memo(({ onUpgrade }: Props) => {
  const [smsFallback, setSmsFallback] = useState(false);
  const [discreetMode, setDiscreetMode] = useState(false);
  const [showDiscreetWizard, setShowDiscreetWizard] = useState(false);
  const [dataSaverMode, setDataSaverMode] = useState(false);
  const [dailyBriefing, setDailyBriefing] = useState(true);
  const [downloadedPacks, setDownloadedPacks] = useState<Set<string>>(new Set(['rondebosch', 'claremont']));
  const [downloading, setDownloading] = useState<string | null>(null);
  const [highContrast, setHighContrast] = useState(() => document.documentElement.classList.contains('high-contrast'));

  useEffect(() => {
    if (highContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
  }, [highContrast]);

  const handleDownloadPack = (id: string) => {
    if (downloadedPacks.size >= 4 && !downloadedPacks.has(id)) return; // max 4 packs (home + 3)
    setDownloading(id);
    setTimeout(() => {
      setDownloadedPacks(prev => new Set([...prev, id]));
      setDownloading(null);
    }, 2000);
  };

  const handleRemovePack = (id: string) => {
    setDownloadedPacks(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account and preferences</p>
      </div>

      {/* Account */}
      <div className="p-6 rounded-xl border border-border bg-card">
        <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2"><User className="w-5 h-5" /> Account</h2>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Name</span><span className="text-foreground">Guest User</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span className="text-foreground">guest@example.com</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Plan</span><span className="text-foreground">Free</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Member since</span><span className="text-foreground">February 2026</span></div>
        </div>
        <div className="flex gap-3 mt-4">
          <button className="px-4 py-2 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-secondary transition-colors">Edit Profile</button>
          <button onClick={() => onUpgrade()} className="px-4 py-2 rounded-lg bg-elite-gradient text-white text-sm font-bold hover:opacity-90 transition-opacity flex items-center gap-1">
            <Crown className="w-3.5 h-3.5" /> UPGRADE TO ELITE
          </button>
        </div>
      </div>

      {/* Preferences */}
      <div className="p-6 rounded-xl border border-border bg-card">
        <h2 className="text-lg font-bold text-foreground mb-4">Preferences</h2>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">I am a:</label>
            <div className="flex flex-wrap gap-2">
              {['Tourist', 'Resident', 'Professional', 'Business'].map(type => (
                <button key={type} className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  type === 'Tourist' ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
                )}>{type}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Risk Tolerance:</label>
            <div className="flex flex-wrap gap-2">
              {['Cautious', 'Balanced', 'Adventurous'].map(level => (
                <button key={level} className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  level === 'Balanced' ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
                )}>{level}</button>
              ))}
            </div>
          </div>

          {/* High Contrast Mode */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-3">
              <Contrast className="w-5 h-5 text-foreground" />
              <div>
                <p className="text-sm font-medium text-foreground">High Contrast Mode</p>
                <p className="text-xs text-muted-foreground">White text on black — WCAG AAA compliant</p>
              </div>
            </div>
            <Switch checked={highContrast} onCheckedChange={setHighContrast} />
          </div>
        </div>
        <button className="mt-4 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors min-h-[48px]">Save Preferences</button>
      </div>

      {/* Notifications */}
      <div className="p-6 rounded-xl border border-border bg-card relative">
        <div className="absolute inset-0 bg-background/60 backdrop-blur-[1px] z-10 flex items-center justify-center rounded-xl">
          <div className="text-center">
            <Lock className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
            <button onClick={() => onUpgrade('Customize notifications with Elite')} className="text-sm font-semibold text-primary hover:underline">Upgrade to customize</button>
          </div>
        </div>
        <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2"><Bell className="w-5 h-5" /> Notifications 👑</h2>
        <p className="text-sm text-muted-foreground">Full notification settings available for Elite members</p>
      </div>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* OFFLINE SAFETY MAPS */}
      {/* ═══════════════════════════════════════════════════════ */}
      <div className="p-6 rounded-xl border border-border bg-card">
        <h2 className="text-lg font-bold text-foreground mb-2 flex items-center gap-2">
          <Download className="w-5 h-5 text-primary" /> Offline Safety Maps <DemoBadge />
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Download safety map packs for your suburb and up to 3 nearby areas. Includes roads, risk zones, shelters, SAPS stations, and your Trusted Network contacts. Auto-updates on WiFi.
        </p>

        <div className="flex items-center justify-between mb-3 p-3 rounded-lg bg-muted/30 border border-border/50">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Database className="w-3.5 h-3.5" />
            <span>{downloadedPacks.size} of 4 packs downloaded</span>
          </div>
          <span className="text-xs text-muted-foreground font-mono">
            {Array.from(downloadedPacks).length * 4}MB cached
          </span>
        </div>

        <div className="space-y-2">
          {suburbPacks.map(pack => {
            const isDownloaded = downloadedPacks.has(pack.id);
            const isDownloading = downloading === pack.id;
            const canDownload = downloadedPacks.size < 4 || isDownloaded;

            return (
              <div key={pack.id} className={cn(
                "flex items-center justify-between p-3 rounded-lg border",
                isDownloaded ? "bg-emerald-500/5 border-emerald-500/20" : "bg-muted/20 border-border/50"
              )}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{pack.name}</span>
                    {isDownloaded && <Badge variant="outline" className="text-[9px] h-4 text-emerald-600 border-emerald-500/30">Cached</Badge>}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    {pack.size} · Updated: {pack.lastUpdated}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {isDownloading ? (
                    <div className="flex items-center gap-2">
                      <RefreshCw className="w-3.5 h-3.5 text-primary animate-spin" />
                      <span className="text-[10px] text-muted-foreground">Downloading...</span>
                    </div>
                  ) : isDownloaded ? (
                    <Button size="sm" variant="ghost" className="h-7 text-[10px] text-muted-foreground" onClick={() => handleRemovePack(pack.id)}>
                      Remove
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" className="h-7 text-[10px]" disabled={!canDownload} onClick={() => handleDownloadPack(pack.id)}>
                      <Download className="w-3 h-3 mr-1" /> Download
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-3 p-3 rounded-lg bg-muted/30 border border-border/50">
          <div className="flex items-start gap-2">
            <WifiOff className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
            <p className="text-[11px] text-muted-foreground">
              Cached maps include: road layout, ward/precinct boundaries, known risk zones, shelter & safe house locations, SAPS stations, and your Trusted Network contacts. Maps auto-refresh when connected to WiFi.
            </p>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* OFFLINE PANIC (enhanced SMS Fallback) */}
      {/* ═══════════════════════════════════════════════════════ */}
      <div className="p-6 rounded-xl border border-border bg-card">
        <h2 className="text-lg font-bold text-foreground mb-2 flex items-center gap-2">
          <WifiOff className="w-5 h-5 text-destructive" /> Offline Panic Mode
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          The panic system works fully without internet. When triggered offline, it sends SMS alerts, uses cached GPS, records audio locally, and queues the full report for upload when connectivity returns.
        </p>
        <div className="flex items-center justify-between p-4 rounded-lg border border-border">
          <div>
            <span className="text-sm font-medium text-foreground">Enable Offline SMS Fallback</span>
            <p className="text-xs text-muted-foreground mt-0.5">Requires mobile network signal for SMS</p>
          </div>
          <Switch checked={smsFallback} onCheckedChange={setSmsFallback} />
        </div>
        {smsFallback && (
          <div className="mt-3 space-y-2">
            <div className="p-3 rounded-lg bg-secondary/50 space-y-2">
              <p className="text-xs text-muted-foreground">📱 SMS template: <span className="font-mono text-foreground">"ALMIEN PANIC ALERT — [Name] needs help at [GPS]. Time: [timestamp]."</span></p>
            </div>
            <div className="p-3 rounded-lg bg-destructive/5 border border-destructive/20">
              <div className="text-xs font-semibold text-foreground mb-1">Offline Panic Sequence:</div>
              <div className="space-y-1">
                {[
                  '1. SMS sent to all Trusted Network contacts with GPS',
                  '2. Cached GPS coordinates used for location',
                  '3. Audio recording starts (stored locally)',
                  '4. Full incident report queued for upload on reconnect',
                  '5. Status screen shows: "OFFLINE MODE — SMS sent to [X] contacts"'
                ].map(step => (
                  <div key={step} className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500 mt-0.5 shrink-0" />
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* DATA SAVER MODE */}
      {/* ═══════════════════════════════════════════════════════ */}
      <div className="p-6 rounded-xl border border-border bg-card">
        <h2 className="text-lg font-bold text-foreground mb-2 flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-500" /> Data Saver Mode
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Reduce mobile data usage significantly. Ideal for prepaid users or areas with limited connectivity.
        </p>
        <div className="flex items-center justify-between p-4 rounded-lg border border-border mb-3">
          <div>
            <span className="text-sm font-medium text-foreground">Enable Data Saver</span>
            <p className="text-xs text-muted-foreground mt-0.5">Reduces data to ~2MB/day</p>
          </div>
          <Switch checked={dataSaverMode} onCheckedChange={setDataSaverMode} />
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className={cn(
            "p-3 rounded-lg border text-center",
            dataSaverMode ? "bg-emerald-500/10 border-emerald-500/30" : "bg-muted/30 border-border/50"
          )}>
            <div className={cn("text-lg font-black", dataSaverMode ? "text-emerald-500" : "text-muted-foreground")}>~2 MB</div>
            <div className="text-[10px] text-muted-foreground">Data Saver / day</div>
          </div>
          <div className={cn(
            "p-3 rounded-lg border text-center",
            !dataSaverMode ? "bg-amber-500/10 border-amber-500/30" : "bg-muted/30 border-border/50"
          )}>
            <div className={cn("text-lg font-black", !dataSaverMode ? "text-amber-500" : "text-muted-foreground")}>~18 MB</div>
            <div className="text-[10px] text-muted-foreground">Standard / day</div>
          </div>
        </div>

        {dataSaverMode && (
          <div className="space-y-1.5 p-3 rounded-lg bg-muted/30 border border-border/50">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Active Optimisations</div>
            {[
              { label: 'Map tiles at reduced resolution', active: true },
              { label: 'Community feed auto-refresh paused', active: true },
              { label: 'Report images compressed before upload', active: true },
              { label: 'Push notifications replace map animations', active: true },
              { label: 'Background syncs deferred to WiFi', active: true },
            ].map(opt => (
              <div key={opt.label} className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                <span>{opt.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* DAILY OFFLINE BRIEFING */}
      {/* ═══════════════════════════════════════════════════════ */}
      <div className="p-6 rounded-xl border border-border bg-card">
        <h2 className="text-lg font-bold text-foreground mb-2 flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" /> Daily Offline Briefing
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Each morning, Almien caches a full "Today's Safety Briefing" for your area. Readable all day without any network connection.
        </p>
        <div className="flex items-center justify-between p-4 rounded-lg border border-border mb-3">
          <div>
            <span className="text-sm font-medium text-foreground">Auto-download morning briefing</span>
            <p className="text-xs text-muted-foreground mt-0.5">Downloads at 06:00 when connected</p>
          </div>
          <Switch checked={dailyBriefing} onCheckedChange={setDailyBriefing} />
        </div>

        {dailyBriefing && (
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-foreground">Today's Briefing — Rondebosch</div>
              <Badge variant="outline" className="text-[9px] text-emerald-600 border-emerald-500/30">Cached ✓</Badge>
            </div>
            <div className="space-y-2">
              <div className="p-2 rounded bg-card/60 border border-border/50">
                <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Last Night's Summary</div>
                <p className="text-xs text-muted-foreground mt-0.5">2 incidents reported (1 vehicle theft, 1 break-in). No violent crime. SAPS patrols increased in southern sector.</p>
              </div>
              <div className="p-2 rounded bg-card/60 border border-border/50">
                <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Load-shedding Today</div>
                <p className="text-xs text-muted-foreground mt-0.5">Stage 2 · 10:00–12:30 and 18:00–20:30. Darkness Window risk: Moderate (evening slot).</p>
              </div>
              <div className="p-2 rounded bg-card/60 border border-border/50">
                <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Threat Level</div>
                <p className="text-xs text-muted-foreground mt-0.5">Precinct threat: <span className="font-semibold text-emerald-600">LOW</span>. No active advisories.</p>
              </div>
              <div className="p-2 rounded bg-card/60 border border-border/50">
                <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Emergency Numbers</div>
                <p className="text-xs text-muted-foreground mt-0.5">SAPS Rondebosch: 021 685 1454 · Fire: 021 535 1100 · Ambulance: 10177 · Police: 10111</p>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground/60 font-mono">Last synced: 08 Mar 2026, 06:02 · Size: 48KB</p>
          </div>
        )}
      </div>

      {/* Discreet Mode */}
      <div className="p-6 rounded-xl border border-purple-500/20 bg-purple-500/5">
        <h2 className="text-lg font-bold text-foreground mb-2 flex items-center gap-2">
          <EyeOff className="w-5 h-5 text-purple-400" /> Discreet Mode
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          When enabled, the Almien app disguises itself as a generic utility app.
          A hidden gesture is required to access the real app.
        </p>
        <div className="flex items-center justify-between p-4 rounded-lg border border-purple-500/15 bg-card mb-3">
          <div>
            <span className="text-sm font-medium text-foreground">Enable Discreet Mode</span>
            <p className="text-xs text-muted-foreground mt-0.5">Disguises app as "Weather" utility</p>
          </div>
          <Switch
            checked={discreetMode}
            onCheckedChange={(checked) => {
              setDiscreetMode(checked);
              if (checked) setShowDiscreetWizard(true);
            }}
          />
        </div>
        {showDiscreetWizard && (
          <div className="p-4 rounded-lg border border-purple-500/20 bg-purple-500/10 space-y-3 animate-fade-in">
            <h4 className="text-sm font-bold text-foreground">Setup Guide</h4>
            <div className="space-y-2">
              {[
                '1. The app icon will change to a generic "Weather" icon on your home screen.',
                '2. Opening the app will show a convincing weather forecast screen.',
                '3. To unlock Almien: long-press the bottom-left corner for 2 seconds, then swipe up.',
                '4. The real app will open. Your data remains fully secure.',
                '5. To disable: return to Settings → Discreet Mode → toggle off.',
              ].map(step => (
                <p key={step} className="text-xs text-muted-foreground leading-relaxed">{step}</p>
              ))}
            </div>
            <Button
              size="sm"
              className="bg-purple-600 hover:bg-purple-700 text-white text-xs"
              onClick={() => setShowDiscreetWizard(false)}
            >
              I Understand — Activate
            </Button>
          </div>
        )}
      </div>

      {/* Privacy */}
      <div className="p-6 rounded-xl border border-border bg-card">
        <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2"><Shield className="w-5 h-5" /> Privacy & Security</h2>
        <div className="space-y-3">
          <button className="w-full text-left px-4 py-3 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-secondary transition-colors">Change Password</button>
          <div className="flex items-center justify-between px-4 py-3 rounded-lg border border-border">
            <span className="text-sm font-medium text-foreground">Two-Factor Authentication</span>
            <span className="text-xs text-muted-foreground">Off</span>
          </div>
          <div className="flex gap-3 text-xs text-primary">
            <Link to="/privacy" className="hover:underline">Privacy Policy</Link>
            <Link to="/terms" className="hover:underline">Terms of Service</Link>
          </div>
        </div>
      </div>

      {/* POPIA Data Transparency Panel */}
      <div className="p-6 rounded-xl border border-accent-info/20 bg-accent-info/5">
        <h2 className="text-lg font-bold text-foreground mb-2 flex items-center gap-2">
          <FileText className="w-5 h-5 text-accent-info" /> Data Transparency & POPIA
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Almien is committed to full compliance with the Protection of Personal Information Act (POPIA) and the City of Cape Town CCTV By-Law (2023).
        </p>
        <div className="space-y-2">
          {[
            { label: 'Location Data', desc: 'Encrypted at rest (AES-256). Never sold. Used only for safety routing and emergency response.' },
            { label: 'Identity Data', desc: 'Siloed from location data. Only linked during active SOS events with explicit consent.' },
            { label: 'CCTV Feed Access', desc: 'Almien displays CCTV metadata only (status, location). No live feeds are accessed or stored.' },
            { label: 'Incident Reports', desc: 'Anonymised by default. Reporter identity only disclosed to SAPS under valid Section 205 subpoena.' },
            { label: 'Data Retention', desc: 'Personal location history auto-purged after 30 days. Anonymised aggregate data retained for safety analytics.' },
          ].map(item => (
            <div key={item.label} className="p-3 rounded-lg bg-card/60 border border-border/50">
              <div className="text-xs font-semibold text-foreground">{item.label}</div>
              <p className="text-[11px] text-muted-foreground mt-0.5">{item.desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-3 p-3 rounded-lg bg-muted/30 border border-border/50 flex items-start gap-2">
          <Shield className="w-4 h-4 text-accent-info mt-0.5 shrink-0" />
          <p className="text-[11px] text-muted-foreground">
            Information Officer: privacy@almien.co.za · POPIA Regulator Ref: ISPA/2026/0042 · CoCT CCTV By-Law compliant
          </p>
        </div>
      </div>

      {/* Support */}
      <div className="p-6 rounded-xl border border-border bg-card">
        <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2"><HelpCircle className="w-5 h-5" /> Support</h2>
        <div className="space-y-2 text-sm">
          <div className="text-muted-foreground">Email: support@almien.co.za</div>
          <div className="text-muted-foreground">Elite: 24/7 Priority Support</div>
        </div>
        <div className="flex gap-3 mt-4">
          <button className="px-4 py-2 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-secondary transition-colors">Send Feedback</button>
          <button className="px-4 py-2 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-secondary transition-colors">Report Bug</button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* USSD FALLBACK & ABOUT */}
      {/* ═══════════════════════════════════════════════════════ */}
      <div className="p-6 rounded-xl border border-border bg-card">
        <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2"><Info className="w-5 h-5" /> About Almien</h2>
        <div className="space-y-1 text-sm text-muted-foreground">
          <div>Almien v2.0.0</div>
          <div>© 2026 Almien Safety Intelligence</div>
          <div className="flex gap-3 text-xs text-primary mt-2">
            <Link to="/terms" className="hover:underline">Terms</Link>
            <Link to="/privacy" className="hover:underline">Privacy</Link>
            <Link to="/licenses" className="hover:underline">Licenses</Link>
            <Link to="/about" className="hover:underline">About Us</Link>
          </div>
        </div>
      </div>

      {/* USSD Fallback */}
      <div className="p-6 rounded-xl border border-primary/20 bg-primary/5">
        <h2 className="text-lg font-bold text-foreground mb-2 flex items-center gap-2">
          <Smartphone className="w-5 h-5 text-primary" /> USSD Access — No Data Required
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Almien's core safety features are available via USSD for feature phone users and those without mobile data. Dial from any phone:
        </p>

        <div className="p-4 rounded-lg bg-card border border-primary/30 text-center mb-4">
          <div className="text-2xl font-black text-primary font-mono tracking-wider">*120*ALMIEN#</div>
          <p className="text-xs text-muted-foreground mt-1">Works on any phone · No data required · Standard USSD rates apply</p>
        </div>

        <div className="rounded-lg border border-border/50 overflow-hidden">
          <div className="p-3 bg-muted/30 border-b border-border/50">
            <div className="text-xs font-semibold text-foreground uppercase tracking-wider">USSD Menu Tree</div>
          </div>
          <div className="p-4 space-y-3 font-mono text-sm">
            <div>
              <div className="text-foreground font-semibold">Welcome to Almien Safety</div>
              <div className="text-muted-foreground text-xs mt-1">Select an option:</div>
            </div>
            <div className="space-y-2 pl-2 border-l-2 border-primary/30">
              <div>
                <span className="text-primary font-bold">1.</span>
                <span className="text-foreground ml-2">Report Incident</span>
                <div className="pl-6 mt-1 space-y-0.5 text-xs text-muted-foreground">
                  <div>1.1 Crime in progress</div>
                  <div>1.2 Suspicious activity</div>
                  <div>1.3 Infrastructure issue</div>
                  <div>1.4 Traffic incident</div>
                  <div>→ Enter suburb name → Confirm → Reference number sent via SMS</div>
                </div>
              </div>
              <div>
                <span className="text-primary font-bold">2.</span>
                <span className="text-foreground ml-2">Panic Alert (SMS-based)</span>
                <div className="pl-6 mt-1 space-y-0.5 text-xs text-muted-foreground">
                  <div>2.1 Send SOS to my Trusted Network</div>
                  <div>2.2 Call nearest SAPS station</div>
                  <div>2.3 Call 10111 (National Emergency)</div>
                  <div>→ Sends SMS with your registered location to all contacts</div>
                </div>
              </div>
              <div>
                <span className="text-primary font-bold">3.</span>
                <span className="text-foreground ml-2">Safe House Locator</span>
                <div className="pl-6 mt-1 space-y-0.5 text-xs text-muted-foreground">
                  <div>3.1 Nearest shelter</div>
                  <div>3.2 Nearest SAPS station</div>
                  <div>3.3 Nearest hospital</div>
                  <div>→ Enter suburb → Receives address + phone number via SMS</div>
                </div>
              </div>
              <div>
                <span className="text-primary font-bold">4.</span>
                <span className="text-foreground ml-2">Today's Risk Level</span>
                <div className="pl-6 mt-1 space-y-0.5 text-xs text-muted-foreground">
                  <div>→ Enter suburb name</div>
                  <div>→ Receives: threat level, active advisories, load-shedding status</div>
                </div>
              </div>
              <div>
                <span className="text-primary font-bold">5.</span>
                <span className="text-foreground ml-2">Register / Update My Details</span>
                <div className="pl-6 mt-1 space-y-0.5 text-xs text-muted-foreground">
                  <div>5.1 Set home suburb</div>
                  <div>5.2 Add trusted contact</div>
                  <div>5.3 Change language</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-3 p-3 rounded-lg bg-muted/30 border border-border/50">
          <div className="flex items-start gap-2">
            <Phone className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
            <p className="text-[11px] text-muted-foreground">
              USSD service is designed to work on any GSM phone — smartphone or feature phone. No app installation required. Available in English, Afrikaans, and isiXhosa. USSD backend integration planned for future release.
            </p>
          </div>
        </div>
      </div>

      <button className="text-xs text-destructive hover:underline">Delete Account</button>
    </div>
  );
});

SettingsView.displayName = 'SettingsView';
export default SettingsView;
