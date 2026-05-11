import { useState, memo } from 'react';
import { cn } from '@/lib/utils';
import {
  MapPin, UserPlus, Bell, Locate, ArrowRight, Check,
  Shield, Clock, Sparkles, ChevronLeft,
} from 'lucide-react';

interface OnboardingFlowProps {
  onComplete: () => void;
}

const crimeTypes = [
  { id: 'robbery', label: 'ROBBERY' },
  { id: 'burglary', label: 'BURGLARY' },
  { id: 'vehicle', label: 'VEHICLE' },
  { id: 'assault', label: 'ASSAULT' },
  { id: 'gbv', label: 'GBV' },
  { id: 'drugs', label: 'NARCOTICS' },
  { id: 'hijacking', label: 'HIJACKING' },
  { id: 'housebreaking', label: 'HOUSEBREAKING' },
];

const timePills = ['06:00', '07:00', '07:30', '08:00', '09:00'];

const STEP_TITLES = [
  'INIT',
  'GEO_PERMIT',
  'BASE_SECTOR',
  'GUARDIAN_LINK',
  'COMMUTE_VECTOR',
  'ALERT_FILTERS',
  'AI_HANDSHAKE',
];

const OnboardingFlow = memo(({ onComplete }: OnboardingFlowProps) => {
  const [step, setStep] = useState(0);
  const [suburb, setSuburb] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [selectedAlerts, setSelectedAlerts] = useState<Set<string>>(new Set(['robbery', 'burglary']));
  const [commuteFrom, setCommuteFrom] = useState('');
  const [commuteTo, setCommuteTo] = useState('');
  const [commuteTime, setCommuteTime] = useState('07:00');

  const totalSteps = 7;
  const next = () => setStep((s) => Math.min(s + 1, totalSteps - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));
  const skip = () => next();

  const toggleAlert = (id: string) => {
    setSelectedAlerts((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const requestLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(() => next(), () => next());
    } else next();
  };

  const enableNotifications = () => {
    if ('Notification' in window) {
      Notification.requestPermission().then(() => next());
    } else next();
  };

  const screens = [
    // ── 1. INIT ──
    <Screen key="welcome">
      <div className="text-center">
        <div className="inline-block border border-[#7C3AED] p-4 mb-6">
          <Shield className="w-10 h-10" style={{ color: '#7C3AED' }} />
        </div>
        <Tag color="#7C3AED">[ TERMINAL BOOT ]</Tag>
        <h1
          className="text-4xl font-bold tracking-tighter mt-2"
          style={{ fontFamily: 'Space Grotesk, sans-serif', color: '#fff' }}
        >
          ALMIEN v2.0
        </h1>
        <div className="mt-1 h-[2px] w-16 bg-[#7C3AED] mx-auto" />
        <p className="text-sm text-[#999] mt-5 mono leading-relaxed max-w-xs mx-auto">
          Urban intelligence terminal.<br />Built for South Africa.
        </p>
      </div>
      <PrimaryBtn onClick={next}>INITIALIZE →</PrimaryBtn>
    </Screen>,

    // ── 2. GEO_PERMIT ──
    <Screen key="location">
      <div className="text-center">
        <IconBlock icon={Locate} />
        <Tag color="#00B4D8">[ GEO PERMISSION ]</Tag>
        <h2 className="screen-h">Lock onto your sector.</h2>
        <p className="screen-p">
          Real-time risk data is keyed to your live coordinates. Telemetry stays on-device.
        </p>
      </div>
      <div className="space-y-2">
        <PrimaryBtn onClick={requestLocation}>GRANT GEO ACCESS</PrimaryBtn>
        <GhostBtn onClick={skip}>SKIP · SET MANUALLY</GhostBtn>
      </div>
    </Screen>,

    // ── 3. BASE_SECTOR ──
    <Screen key="suburb">
      <div className="text-center">
        <IconBlock icon={MapPin} />
        <Tag color="#7C3AED">[ BASE SECTOR ]</Tag>
        <h2 className="screen-h">Where do you operate from?</h2>
        <p className="screen-p">Your daily intelligence briefing is built around this area.</p>
      </div>
      <div className="space-y-2">
        <label className="label-micro block" style={{ color: '#666' }}>[ SUBURB ]</label>
        <input
          className="t-input w-full"
          placeholder="e.g. RONDEBOSCH"
          value={suburb}
          onChange={(e) => setSuburb(e.target.value)}
        />
      </div>
      <div className="flex gap-2">
        <GhostBtn onClick={skip} className="flex-1">SKIP</GhostBtn>
        <PrimaryBtn onClick={next} disabled={!suburb.trim()} className="flex-[2]">
          CONTINUE →
        </PrimaryBtn>
      </div>
    </Screen>,

    // ── 4. GUARDIAN_LINK ──
    <Screen key="contact">
      <div className="text-center">
        <IconBlock icon={UserPlus} />
        <Tag color="#FFD60A">[ GUARDIAN LINK ]</Tag>
        <h2 className="screen-h">Designate emergency contact.</h2>
        <p className="screen-p">
          Notified instantly on panic activation. Required for SOS broadcast.
        </p>
      </div>
      <div className="space-y-3">
        <div>
          <label className="label-micro block mb-1.5" style={{ color: '#666' }}>[ NAME ]</label>
          <input
            className="t-input w-full"
            placeholder="FULL NAME"
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
          />
        </div>
        <div>
          <label className="label-micro block mb-1.5" style={{ color: '#666' }}>[ PHONE ]</label>
          <input
            className="t-input w-full"
            type="tel"
            placeholder="+27 ..."
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
          />
        </div>
      </div>
      <div className="flex gap-2">
        <GhostBtn onClick={skip} className="flex-1">SKIP</GhostBtn>
        <PrimaryBtn onClick={next} className="flex-[2]">CONTINUE →</PrimaryBtn>
      </div>
    </Screen>,

    // ── 5. COMMUTE_VECTOR ──
    <Screen key="commute">
      <div className="text-center">
        <IconBlock icon={Clock} color="#00B4D8" />
        <Tag color="#00B4D8">[ COMMUTE VECTOR ]</Tag>
        <h2 className="screen-h">Daily corridor intel.</h2>
        <p className="screen-p">
          Safi monitors your route and raises alerts before departure.
        </p>
      </div>
      <div className="space-y-3">
        <div>
          <label className="label-micro block mb-1.5" style={{ color: '#666' }}>[ ORIGIN ]</label>
          <input
            className="t-input w-full"
            placeholder="SEA POINT"
            value={commuteFrom || suburb}
            onChange={(e) => setCommuteFrom(e.target.value)}
          />
        </div>
        <div>
          <label className="label-micro block mb-1.5" style={{ color: '#666' }}>[ DESTINATION ]</label>
          <input
            className="t-input w-full"
            placeholder="WORK · SCHOOL · GYM"
            value={commuteTo}
            onChange={(e) => setCommuteTo(e.target.value)}
          />
        </div>
        <div>
          <label className="label-micro block mb-2" style={{ color: '#666' }}>[ DEPARTURE WINDOW ]</label>
          <div className="grid grid-cols-5 gap-1">
            {timePills.map((t) => (
              <button
                key={t}
                onClick={() => setCommuteTime(t)}
                className="py-2 text-xs font-bold tracking-wider border transition-colors"
                style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  background: commuteTime === t ? '#7C3AED' : 'transparent',
                  color: commuteTime === t ? '#000' : '#999',
                  borderColor: commuteTime === t ? '#7C3AED' : '#1A1A1A',
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        <GhostBtn onClick={skip} className="flex-1">SKIP</GhostBtn>
        <PrimaryBtn onClick={next} className="flex-[2]">CONTINUE →</PrimaryBtn>
      </div>
    </Screen>,

    // ── 6. ALERT_FILTERS ──
    <Screen key="notifications">
      <div className="text-center">
        <IconBlock icon={Bell} color="#FF9500" />
        <Tag color="#FF9500">[ ALERT FILTERS ]</Tag>
        <h2 className="screen-h">Tune your threat feed.</h2>
        <p className="screen-p">
          Select event categories. Real-time push to your terminal.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        {crimeTypes.map((ct) => {
          const active = selectedAlerts.has(ct.id);
          return (
            <button
              key={ct.id}
              onClick={() => toggleAlert(ct.id)}
              className="flex items-center gap-2 px-3 py-3 border text-xs font-bold tracking-wider transition-colors text-left"
              style={{
                fontFamily: 'JetBrains Mono, monospace',
                background: active ? 'rgba(0,255,133,0.08)' : 'transparent',
                color: active ? '#7C3AED' : '#666',
                borderColor: active ? '#7C3AED' : '#1A1A1A',
              }}
            >
              <span
                className="w-3 h-3 border flex items-center justify-center shrink-0"
                style={{ borderColor: active ? '#7C3AED' : '#333' }}
              >
                {active && <Check className="w-2.5 h-2.5" />}
              </span>
              <span className="truncate">{ct.label}</span>
            </button>
          );
        })}
      </div>
      <div className="space-y-2">
        <PrimaryBtn onClick={enableNotifications}>ENABLE PUSH ALERTS</PrimaryBtn>
        <GhostBtn onClick={next}>SKIP</GhostBtn>
      </div>
    </Screen>,

    // ── 7. AI_HANDSHAKE ──
    <Screen key="safi">
      <div className="text-center">
        <div className="inline-block border border-[#7C3AED] p-4 mb-6">
          <Sparkles className="w-10 h-10" style={{ color: '#7C3AED' }} />
        </div>
        <Tag color="#7C3AED">[ AI HANDSHAKE ]</Tag>
        <h2 className="screen-h">SAFI online.</h2>
        <p className="screen-p">
          AI safety concierge. Knows your sector, commute, and risk profile. Always on.
        </p>
      </div>
      <div className="space-y-1.5">
        {[
          { l: 'DAILY BRIEFING', v: 'ACTIVE' },
          { l: 'ROUTE SHIELD', v: 'ARMED' },
          { l: 'EMERGENCY MODE', v: 'STANDBY' },
        ].map((m) => (
          <div
            key={m.l}
            className="flex items-center justify-between border border-[#1A1A1A] bg-[#0A0A0A] px-3 py-2.5"
          >
            <span className="label-micro" style={{ color: '#666' }}>{m.l}</span>
            <span
              className="text-xs font-bold tracking-wider"
              style={{ fontFamily: 'JetBrains Mono, monospace', color: '#7C3AED' }}
            >
              ● {m.v}
            </span>
          </div>
        ))}
      </div>
      <PrimaryBtn onClick={onComplete}>ENTER TERMINAL →</PrimaryBtn>
    </Screen>,
  ];

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col text-white">
      {/* Scanline overlay */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, #7C3AED 0, #7C3AED 1px, transparent 1px, transparent 4px)',
        }}
      />

      {/* TOP STATUS STRIP */}
      <header className="relative z-10 flex items-center justify-between px-4 py-3 border-b border-[#1A1A1A]">
        <button
          onClick={back}
          disabled={step === 0}
          className="flex items-center gap-1 label-micro disabled:opacity-30 hover:text-[#7C3AED] transition-colors"
          style={{ color: '#666' }}
        >
          <ChevronLeft className="w-3 h-3" /> BACK
        </button>
        <div className="label-micro mono" style={{ color: '#7C3AED' }}>
          {String(step + 1).padStart(2, '0')}/{String(totalSteps).padStart(2, '0')} · {STEP_TITLES[step]}
        </div>
        <button
          onClick={onComplete}
          className="label-micro hover:text-[#7C3AED] transition-colors"
          style={{ color: '#666' }}
        >
          ABORT
        </button>
      </header>

      {/* Progress segments */}
      <div className="relative z-10 flex gap-0.5 px-4 pt-2">
        {Array.from({ length: totalSteps }, (_, i) => (
          <div
            key={i}
            className="flex-1 h-0.5 transition-colors"
            style={{
              background: i <= step ? '#7C3AED' : '#1A1A1A',
            }}
          />
        ))}
      </div>

      {/* Screen body */}
      <div className="relative z-10 flex-1 overflow-y-auto px-5 py-6">
        <div className="max-w-sm mx-auto h-full flex flex-col gap-6 justify-center min-h-[480px]">
          {screens[step]}
        </div>
      </div>
    </div>
  );
});

OnboardingFlow.displayName = 'OnboardingFlow';
export default OnboardingFlow;

// ── Layout helpers ──
const Screen = ({ children }: { children: React.ReactNode }) => (
  <div className="space-y-6 animate-fade-in">{children}</div>
);

const Tag = ({ children, color }: { children: React.ReactNode; color: string }) => (
  <div className="label-micro mb-1.5" style={{ color }}>
    {children}
  </div>
);

const IconBlock = ({
  icon: Icon,
  color = '#7C3AED',
}: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  color?: string;
}) => (
  <div
    className="inline-block border p-3 mb-5"
    style={{ borderColor: color }}
  >
    <Icon className="w-7 h-7" style={{ color }} />
  </div>
);

const PrimaryBtn = ({
  children,
  onClick,
  disabled,
  className,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={cn('btn-primary w-full', className)}
  >
    {children}
  </button>
);

const GhostBtn = ({
  children,
  onClick,
  className,
}: {
  children: React.ReactNode;
  onClick: () => void;
  className?: string;
}) => (
  <button
    onClick={onClick}
    className={cn(
      'w-full py-3 border border-[#1A1A1A] text-xs font-bold tracking-wider uppercase text-[#666] hover:text-white hover:border-[#333] transition-colors',
      className,
    )}
    style={{ fontFamily: 'JetBrains Mono, monospace' }}
  >
    {children}
  </button>
);
