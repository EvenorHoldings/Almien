import { memo, useMemo, useState } from 'react';
import { ArrowUpRight, Plus } from 'lucide-react';
import type { ViewId } from '../AlmienDashboard';
import { useCountUp } from '@/hooks/useCountUp';
import DemoBadge from '@/components/DemoBadge';

interface Props {
  onUpgrade?: (trigger?: string) => void;
  onNavigate?: (view: ViewId) => void;
}

type Status = 'online' | 'away' | 'offline';
interface Guardian {
  id: string;
  name: string;
  role: string;
  status: Status;
}
interface FeedItem {
  id: string;
  sender: string;
  message: string;
  time: string;
}

const MOCK_GUARDIANS: Guardian[] = [
  { id: 'g1', name: 'Amahle Dlamini', role: 'Family · Sister', status: 'online' },
  { id: 'g2', name: 'Brendan Pillay', role: 'Armed Response', status: 'online' },
  { id: 'g3', name: 'Carla Fortuin', role: 'Neighbour Watch', status: 'away' },
  { id: 'g4', name: 'Kabelo Mahlangu', role: 'Friend', status: 'offline' },
  { id: 'g5', name: 'Priya Naidoo', role: 'Family · Mother', status: 'online' },
];

const MOCK_FEED: FeedItem[] = [
  { id: 'f1', sender: 'Amahle D.', message: 'Quiet on Long St tonight, road clear past the station.', time: '12m' },
  { id: 'f2', sender: 'Carla F.', message: 'Power back on in Sea Point ward 54.', time: '38m' },
  { id: 'f3', sender: 'Brendan P.', message: 'Suspicious vehicle reported on Buitengracht — patrol on the way.', time: '1h' },
  { id: 'f4', sender: 'Kabelo M.', message: 'Safe arrival at Gardens. Thanks for the route.', time: '2h' },
];

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

const STATUS_DOT: Record<Status, string> = {
  online: '#7C3AED',
  away: '#FF9500',
  offline: '#333333',
};
const STATUS_LABEL: Record<Status, string> = {
  online: 'ONLINE',
  away: 'AWAY',
  offline: 'OFFLINE',
};
const STATUS_TEXT: Record<Status, string> = {
  online: '#7C3AED',
  away: '#FF9500',
  offline: '#555555',
};

/* ─── Avatar ─────────────────────────────── */
const Avatar = memo(({ name, size = 40 }: { name: string; size?: number }) => {
  const { bg, fg } = getAvatarColor(name);
  return (
    <div
      className="flex items-center justify-center shrink-0"
      style={{
        width: size, height: size, background: bg, color: fg,
        fontFamily: 'Space Grotesk, sans-serif',
        fontSize: size <= 28 ? 11 : 14,
        fontWeight: 700,
      }}
    >
      {initials(name)}
    </div>
  );
});
Avatar.displayName = 'Avatar';

/* ─── Stat block ─────────────────────────── */
const StatBlock = memo(({ value, label, highlight }: { value: number; label: string; highlight?: boolean }) => {
  const display = useCountUp(value, 1100);
  return (
    <div
      className="flex flex-col items-center justify-center px-3 py-4"
      style={{
        background: '#0A0A0A',
        border: highlight ? '0.5px solid #7C3AED' : '0.5px solid #1F1F1F',
      }}
    >
      <div className="text-white tabular-nums"
        style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 24, fontWeight: 700 }}>
        {display}
      </div>
      <div className="mt-1 label-micro" style={{ color: '#555' }}>{label}</div>
    </div>
  );
});
StatBlock.displayName = 'StatBlock';

/* ─── Guardian row ──────────────────────── */
const GuardianRow = memo(({ g }: { g: Guardian }) => (
  <div className="t-card neutral mx-0 transition-transform duration-100 active:scale-[0.99]"
    style={{ marginBottom: 1, borderLeftColor: STATUS_DOT[g.status] }}>
    <div className="flex items-center gap-3">
      <Avatar name={g.name} />
      <div className="min-w-0 flex-1">
        <div className="text-white truncate"
          style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 500 }}>
          {g.name}
        </div>
        <div className="text-[#555] truncate mt-0.5"
          style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12 }}>
          {g.role}
        </div>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <span style={{
          width: 8, height: 8, borderRadius: '50%', background: STATUS_DOT[g.status],
        }} />
        <span style={{
          fontFamily: 'JetBrains Mono, monospace', fontSize: 10,
          color: STATUS_TEXT[g.status], letterSpacing: '0.08em', fontWeight: 600,
        }}>
          {STATUS_LABEL[g.status]}
        </span>
      </div>
    </div>
  </div>
));
GuardianRow.displayName = 'GuardianRow';

/* ─── Feed item ─────────────────────────── */
const FeedRow = memo(({ item }: { item: FeedItem }) => (
  <div className="t-card intel mx-0" style={{ marginBottom: 1 }}>
    <div className="flex items-start gap-3">
      <Avatar name={item.sender} size={28} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-3 mb-1">
          <span className="text-white truncate"
            style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, fontWeight: 600 }}>
            {item.sender}
          </span>
          <span className="shrink-0 tabular-nums"
            style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#555' }}>
            {item.time}
          </span>
        </div>
        <div className="text-white"
          style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, lineHeight: 1.45 }}>
          {item.message}
        </div>
      </div>
    </div>
  </div>
));
FeedRow.displayName = 'FeedRow';

/* ─── Main view ─────────────────────────── */
const TrustGridView = memo((_props: Props) => {
  const [guardians] = useState<Guardian[]>(MOCK_GUARDIANS);

  const stats = useMemo(() => {
    const online = guardians.filter((g) => g.status === 'online').length;
    return {
      guardians: guardians.length,
      alertsShared: 142,
      trustScore: 87,
      online,
    };
  }, [guardians]);

  return (
    <div className="page-animate min-h-dvh bg-black" style={{ paddingBottom: 136 }}>
      {/* ── HEADER ─────────────────────────── */}
      <div
        className="sticky top-0 z-20 px-5 pb-3 bg-black"
        style={{
          paddingTop: 'max(env(safe-area-inset-top), 16px)',
          borderBottom: '1px solid #1A1A1A',
        }}
      >
        <h1 className="text-white"
          style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 22, fontWeight: 700, letterSpacing: '-0.01em' }}>
          NETWORK
         <DemoBadge className="ml-2 align-middle" /></h1>
        <p className="text-[#555] mt-0.5"
          style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12 }}>
          Community Trust Mesh · {stats.guardians} verified contacts
        </p>
      </div>

      {/* ── PANIC STRIP ───────────────────── */}
      <div
        className="mt-3 px-5 py-3 flex items-center justify-between"
        style={{
          background: '#0A0A0A',
          borderTop: '0.5px solid #1F1F1F',
          borderBottom: '0.5px solid #1F1F1F',
          borderLeft: '2px solid #FF3B30',
        }}
      >
        <div>
          <div className="label-micro">PANIC NETWORK</div>
          <div className="mt-0.5"
            style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#7C3AED', fontWeight: 500 }}>
            {stats.online} guardians online
          </div>
        </div>
        <button className="btn-ghost flex items-center gap-1" style={{ color: '#FF3B30', padding: '6px 0' }}>
          ACTIVATE <ArrowUpRight className="w-3 h-3" strokeWidth={2.5} />
        </button>
      </div>

      {/* ── TRUST STATS ───────────────────── */}
      <div className="px-5 mt-4 grid grid-cols-3 gap-[1px]">
        <StatBlock value={stats.guardians} label="GUARDIANS" />
        <StatBlock value={stats.alertsShared} label="ALERTS" highlight />
        <StatBlock value={stats.trustScore} label="TRUST" />
      </div>

      {/* ── GUARDIANS ─────────────────────── */}
      <div className="mt-5">
        <div className="px-5 mb-3 flex items-center justify-between">
          <span className="label-micro">GUARDIANS</span>
          <button className="btn-ghost flex items-center gap-1" style={{ padding: '4px 0' }}>
            INVITE <Plus className="w-3 h-3" strokeWidth={2.5} />
          </button>
        </div>
        {guardians.map((g) => <GuardianRow key={g.id} g={g} />)}
      </div>

      {/* ── COMMUNITY FEED ────────────────── */}
      <div className="mt-5 mb-6">
        <div className="px-5 mb-3">
          <span className="label-micro">COMMUNITY FEED</span>
        </div>
        {MOCK_FEED.map((f) => <FeedRow key={f.id} item={f} />)}
      </div>
    </div>
  );
});

TrustGridView.displayName = 'TrustGridView';
export default TrustGridView;
