import { memo } from 'react';
import { Bell, Filter, ChevronRight, Cpu, Navigation, Radio } from 'lucide-react';
import ScoreRing from './ScoreRing';
import NearestEmergencyCard from './NearestEmergencyCard';
import { useProactiveSafetyAlerts } from '@/hooks/useProactiveSafetyAlerts';
import type { ViewId } from './AlmienDashboard';

interface Props {
  onNavigate: (view: ViewId) => void;
  onOpenSafi?: (mode?: 'chat' | 'briefing' | 'route' | 'emergency') => void;
  onUpgrade?: (trigger?: string) => void;
}

// ── Mock signal data — preserved from DashboardView ──
const liveThreats = [
  { tone: '#FF3B30', text: 'Hijack attempt · N1 onramp', time: '4m' },
  { tone: '#FF9500', text: 'Suspicious vehicle · Beach Rd', time: '12m' },
  { tone: '#00B4D8', text: 'SAPS mobile checkpoint active', time: '24m' },
  { tone: '#FF3B30', text: 'Smash & grab · M3 northbound', time: '38m' },
];

const incidents = [
  { tier: '#FF3B30', cat: 'THREAT',     title: 'Vehicle break-in · Beach Rd', time: '14m' },
  { tier: '#FF3B30', cat: 'THREAT',     title: 'Robbery · Main Rd, Green Point', time: '28m' },
  { tier: '#FF9500', cat: 'CAUTION',    title: 'Suspicious activity · High Level Rd', time: '52m' },
  { tier: '#00B4D8', cat: 'INTEL',      title: 'CPF patrol clear · High Level sector', time: '1h' },
];

const CommandCenterHome = memo(({ onNavigate, onOpenSafi }: Props) => {
  const score = 78;
  useProactiveSafetyAlerts();

  return (
    <div className="page-animate w-full bg-black" style={{ paddingBottom: 136 }}>
      {/* HEADER ROW */}
      <header
        className="px-5 pt-4 flex items-start justify-between"
        style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 16px)' }}
      >
        <div>
          <div
            className="text-[11px]"
            style={{
              fontFamily: 'Space Grotesk, sans-serif',
              fontWeight: 700,
              color: '#555',
              letterSpacing: '0.2em',
            }}
          >
            ALMIEN
          </div>
          <div className="text-[13px] text-white mt-1">Sea Point · Cape Town</div>
        </div>
        <button
          aria-label="Notifications"
          className="relative p-2 -mr-2"
        >
          <Bell size={22} color="#fff" strokeWidth={1.75} />
          <span
            aria-hidden
            className="absolute top-1.5 right-1.5 w-[6px] h-[6px]"
            style={{ background: '#FF3B30', borderRadius: '50%' }}
          />
        </button>
      </header>

      {/* SCORE RING */}
      <ScoreRing score={score} location="Cape Town Central · Ward 57" />

      {/* THREAT TICKER */}
      <section className="mt-6">
        <div className="px-5 flex items-center justify-between mb-2">
          <span className="label-micro">LIVE THREATS</span>
          <button onClick={() => onNavigate('alerts')} className="btn-ghost p-0">VIEW ALL ↗</button>
        </div>
        <div className="px-5 flex gap-2 overflow-x-auto scrollbar-none" style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}>
          {liveThreats.map((t, i) => (
            <div
              key={i}
              className="inline-flex items-center gap-2 py-2 px-3 whitespace-nowrap shrink-0"
              style={{ background: '#0A0A0A', border: '0.5px solid #2A2A2A', scrollSnapAlign: 'start' }}
            >
              <span style={{ width: 6, height: 6, background: t.tone, borderRadius: '50%' }} aria-hidden />
              <span className="text-[12px] text-white">{t.text}</span>
              <span className="mono text-[10px] text-[#555]">{t.time}</span>
            </div>
          ))}
          {/* Edge spacer so last pill clears the right padding cleanly */}
          <div aria-hidden style={{ width: 8, flexShrink: 0 }} />
        </div>
      </section>

      {/* INCIDENT FEED */}
      <section className="mt-6">
        <div className="px-5 flex items-center justify-between mb-2">
          <span className="label-micro">INCIDENT FEED</span>
          <button aria-label="Filter" className="p-1">
            <Filter size={16} color="#555" />
          </button>
        </div>
        <div className="flex flex-col">
          {incidents.map((it, i) => (
            <button
              key={i}
              onClick={() => onNavigate('alerts')}
              className="flex items-stretch gap-3 transition-transform duration-100 active:scale-[0.99]"
              style={{
                background: '#0A0A0A',
                borderTop: '0.5px solid #111',
                borderBottom: i === incidents.length - 1 ? '0.5px solid #111' : 'none',
                marginBottom: 1,
              }}
            >
              <span aria-hidden style={{ width: 4, background: it.tier, flexShrink: 0 }} />
              <div className="flex-1 min-w-0 py-3 pr-3 text-left">
                <div className="mono text-[10px] uppercase" style={{ color: it.tier, letterSpacing: '0.1em' }}>
                  {it.cat}
                </div>
                <div className="text-[14px] text-white mt-0.5 truncate">{it.title}</div>
              </div>
              <div className="flex items-center gap-2 pr-3">
                <span className="mono text-[10px] text-[#555]">{it.time}</span>
                <ChevronRight size={14} color="#333" />
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* NEAREST EMERGENCY (SAPS + Hospital) */}
      <NearestEmergencyCard />

      {/* QUICK ACTIONS */}
      <section className="mt-6 px-5 grid grid-cols-3 gap-2">
        <QuickAction
          Icon={Cpu}
          color="#00B4D8"
          label="Safi AI"
          onClick={() => onOpenSafi?.('chat')}
        />
        <QuickAction
          Icon={Navigation}
          color="#00FF85"
          label="Safe Route"
          onClick={() => onNavigate('safe-route')}
        />
        <QuickAction
          Icon={Radio}
          color="#00FF85"
          label="Network"
          onClick={() => onNavigate('community')}
        />
      </section>
    </div>
  );
});

function QuickAction({ Icon, color, label, onClick }: { Icon: typeof Cpu; color: string; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col gap-2 p-4 text-left transition-transform duration-100 active:scale-[0.97]"
      style={{ background: '#0A0A0A', border: '0.5px solid #1F1F1F' }}
    >
      <Icon size={20} color={color} strokeWidth={1.75} />
      <span className="text-[11px]" style={{ color: '#A0A0A0', fontFamily: 'DM Sans, sans-serif' }}>
        {label}
      </span>
    </button>
  );
}

CommandCenterHome.displayName = 'CommandCenterHome';
export default CommandCenterHome;
