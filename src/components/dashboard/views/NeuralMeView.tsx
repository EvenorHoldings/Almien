import { memo, useMemo } from 'react';
import {
  ChevronRight, Settings, Cpu, Bell, Shield, Users, Radio, Crown, Lock,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ViewId } from '../AlmienDashboard';
import { useCountUp } from '@/hooks/useCountUp';

interface Props {
  onUpgrade?: (trigger?: string) => void;
  onNavigate?: (view: ViewId) => void;
}

/* ─── Avatar helpers ─────────────────────── */
function getAvatarColor(name: string): { bg: string; fg: string } {
  const c = (name[0] || 'A').toUpperCase();
  if (c <= 'E') return { bg: '#2E1065', fg: '#7C3AED' };
  if (c <= 'J') return { bg: '#00243A', fg: '#00B4D8' };
  if (c <= 'O') return { bg: '#1A0A00', fg: '#FF9500' };
  if (c <= 'T') return { bg: '#1A0000', fg: '#FF3B30' };
  return { bg: '#1A1A00', fg: '#FFD60A' };
}
function initials(name: string) {
  return name.split(' ').map((s) => s[0]).slice(0, 2).join('').toUpperCase();
}

interface MenuRow {
  id: string;
  label: string;
  sub?: string;
  icon: LucideIcon;
  color: string;
  view?: ViewId;
}

const SECTIONS: { title: string; rows: MenuRow[] }[] = [
  {
    title: 'SAFETY',
    rows: [
      { id: 's1', label: 'Safi AI Concierge', sub: 'Personal safety assistant', icon: Cpu, color: '#00B4D8', view: 'safi-history' },
      { id: 's2', label: 'Alert Preferences', sub: 'Notification rules', icon: Bell, color: '#FF9500', view: 'alerts' },
      { id: 's3', label: 'Safe Zones', sub: 'Manage trusted areas', icon: Shield, color: '#7C3AED', view: 'safety-network' },
    ],
  },
  {
    title: 'NETWORK',
    rows: [
      { id: 'n1', label: 'My Guardians', sub: '5 verified contacts', icon: Users, color: '#7C3AED', view: 'community' },
      { id: 'n2', label: 'Panic Network', sub: 'Hold-to-activate · 2s', icon: Radio, color: '#FF3B30', view: 'community' },
    ],
  },
  {
    title: 'ACCOUNT',
    rows: [
      { id: 'a1', label: 'Subscription', sub: 'Almien Standard · upgrade', icon: Crown, color: '#FFD60A' },
      { id: 'a2', label: 'Privacy & Data', sub: 'POPIA controls', icon: Lock, color: '#A0A0A0', view: 'settings' },
      { id: 'a3', label: 'Notifications', sub: 'Push · email · SMS', icon: Bell, color: '#A0A0A0', view: 'settings' },
    ],
  },
];

interface ActivityLine {
  ts: string;
  positive: boolean;
  action: string;
}
const ACTIVITY: ActivityLine[] = [
  { ts: '14:22:08', positive: true,  action: 'route_cleared :: long_st_corridor' },
  { ts: '14:18:33', positive: false, action: 'alert_received :: theft @ grand_parade' },
  { ts: '13:55:12', positive: true,  action: 'guardian_added :: Priya Naidoo' },
  { ts: '13:40:41', positive: true,  action: 'safe_zone_check :: home (98)' },
  { ts: '12:08:19', positive: false, action: 'incident_filed :: anonymous_witness' },
  { ts: '11:32:06', positive: true,  action: 'commute_shield :: armed' },
];

/* ─── Score Terminal ─────────────────────── */
const ScoreTerminal = memo(({ score, alerts, routes, trust }: {
  score: number; alerts: number; routes: number; trust: number;
}) => {
  const sScore = useCountUp(score, 1100);
  const sAlerts = useCountUp(alerts, 1100);
  const sRoutes = useCountUp(routes, 1100);
  const sTrust = useCountUp(trust, 1100);
  const fillPct = Math.max(0, Math.min(100, score));

  return (
    <div className="mt-5 p-4" style={{ background: '#000', border: '1px solid #1F1F1F' }}>
      <div className="flex items-center justify-between">
        <span className="mono" style={{ fontSize: 10, color: '#555', letterSpacing: '0.1em' }}>
          GUARDIAN_RISK_ENGINE v2.1
        </span>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#7C3AED' }} />
      </div>
      <div className="mt-3" style={{ height: 1, background: '#1A1A1A' }} />

      <div className="mt-3 grid grid-cols-2 gap-3">
        {[
          { l: 'SAFETY_SCORE', v: sScore },
          { l: 'ALERTS_FILED', v: sAlerts },
          { l: 'ROUTES_SCANNED', v: sRoutes },
          { l: 'NETWORK_TRUST', v: sTrust },
        ].map((cell) => (
          <div key={cell.l}>
            <div className="mono" style={{ fontSize: 10, color: '#555', letterSpacing: '0.08em' }}>
              {cell.l}
            </div>
            <div className="text-white tabular-nums mt-0.5"
              style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 20, fontWeight: 700 }}>
              {cell.v}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 w-full" style={{ height: 2, background: '#111' }}>
        <div
          style={{
            width: `${fillPct}%`, height: '100%', background: '#7C3AED',
            transition: 'width 1s ease-out',
          }}
        />
      </div>
    </div>
  );
});
ScoreTerminal.displayName = 'ScoreTerminal';

/* ─── Menu row ───────────────────────────── */
const MenuRowCmp = memo(({ row, onTap }: { row: MenuRow; onTap?: () => void }) => {
  const Icon = row.icon;
  return (
    <button
      onClick={onTap}
      className="w-full flex items-center gap-4 px-5 py-4 text-left transition-colors active:bg-[#111]"
      style={{ background: '#0A0A0A', borderBottom: '1px solid #111' }}
    >
      <Icon className="w-5 h-5 shrink-0" style={{ color: row.color }} strokeWidth={1.5} />
      <div className="min-w-0 flex-1">
        <div className="text-white truncate"
          style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 500 }}>
          {row.label}
        </div>
        {row.sub && (
          <div className="text-[#555] truncate mt-0.5"
            style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12 }}>
            {row.sub}
          </div>
        )}
      </div>
      <ChevronRight className="w-4 h-4 text-[#333] shrink-0" />
    </button>
  );
});
MenuRowCmp.displayName = 'MenuRowCmp';

/* ─── Main view ─────────────────────────── */
const NeuralMeView = memo(({ onNavigate, onUpgrade }: Props) => {
  // In production these would come from useProfile / useElite hooks.
  const name = 'Naledi Mokoena';
  const userId = useMemo(() => 'A7K3X9', []);
  const isElite = false;

  const avatar = getAvatarColor(name);

  const handleRowTap = (row: MenuRow) => {
    if (row.id === 'a1' && !isElite) { onUpgrade?.('Account · Subscription'); return; }
    if (row.view) onNavigate?.(row.view);
  };

  return (
    <div className="page-animate min-h-dvh bg-black" style={{ paddingBottom: 136 }}>
      {/* ── HERO ──────────────────────────── */}
      <div
        className="px-5 pb-6"
        style={{
          paddingTop: 'max(env(safe-area-inset-top), 24px)',
          background: '#0A0A0A',
          borderBottom: '1px solid #1A1A1A',
        }}
      >
        <div className="flex items-center justify-between">
          <span className="label-micro" style={{ color: '#2A2A2A' }}>NEURAL_PROFILE</span>
          <button
            onClick={() => onNavigate?.('settings')}
            className="p-1 -m-1"
            aria-label="Settings"
          >
            <Settings className="w-[22px] h-[22px] text-[#555]" strokeWidth={1.5} />
          </button>
        </div>

        {/* Profile block */}
        <div className="mt-4 flex items-center gap-4">
          <div className="relative shrink-0">
            <div
              className="flex items-center justify-center"
              style={{
                width: 64, height: 64, background: avatar.bg, color: avatar.fg,
                fontFamily: 'Space Grotesk, sans-serif', fontSize: 24, fontWeight: 700,
              }}
            >
              {initials(name)}
            </div>
            <div
              className="absolute"
              style={{
                right: 0, bottom: 0, width: 14, height: 14,
                background: '#7C3AED', border: '2px solid #0A0A0A',
              }}
              aria-label="Plan active"
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="text-white truncate"
              style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 20, fontWeight: 700 }}>
              {name}
            </div>
            <div className="mt-0.5 truncate mono"
              style={{ fontSize: 11, color: '#555', letterSpacing: '0.08em' }}>
              USER_ID: ALM-{userId}
            </div>
            <div className="mt-2">
              <span className={isElite ? 'sig-badge safe' : 'sig-badge intel'}>
                {isElite ? 'ELITE' : 'STANDARD'}
              </span>
            </div>
          </div>
        </div>

        {/* Score terminal */}
        <ScoreTerminal score={84} alerts={12} routes={37} trust={87} />
      </div>

      {/* ── SECTION LIST ──────────────────── */}
      <div className="mt-4">
        {SECTIONS.map((sec) => (
          <div key={sec.title} className="mb-5">
            <div className="px-5 mb-2 label-micro">{sec.title}</div>
            <div>
              {sec.rows.map((row) => (
                <MenuRowCmp key={row.id} row={row} onTap={() => handleRowTap(row)} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* ── ACTIVITY LOG ──────────────────── */}
      <div className="mt-2 px-5 mb-6">
        <div className="mb-3 label-micro">ACTIVITY_LOG</div>
        <div style={{ background: '#000', border: '1px solid #111', padding: '12px 14px' }}>
          {ACTIVITY.map((line, i) => (
            <div
              key={i}
              className="flex items-baseline gap-2"
              style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 11,
                lineHeight: 1.7,
                color: line.positive ? '#7C3AED' : '#FF3B30',
              }}
            >
              <span style={{ color: '#333' }}>{line.ts}</span>
              <span style={{ color: '#555' }}>›</span>
              <span className="truncate">{line.action}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

NeuralMeView.displayName = 'NeuralMeView';
export default NeuralMeView;
