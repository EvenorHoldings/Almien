import { useState, useRef, useCallback, useEffect, memo } from 'react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface PanicContact {
  name: string;
  role: string;
  notified: boolean;
}

const mockContacts: PanicContact[] = [
  { name: 'MOM', role: 'PRIMARY', notified: false },
  { name: 'PARTNER', role: 'PRIMARY', notified: false },
  { name: 'ADT_ARMED_RESPONSE', role: 'TIER_1', notified: false },
];

const mockStewards = [
  { name: 'STEWARD_J_MTOLO', distance: 120, notified: false },
  { name: 'STEWARD_N_DAVIDS', distance: 340, notified: false },
  { name: 'STEWARD_T_SWART', distance: 480, notified: false },
];

const PanicButton = memo(() => {
  const [holding, setHolding] = useState(false);
  const [progress, setProgress] = useState(0);
  const [panicActive, setPanicActive] = useState(false);
  const [contacts, setContacts] = useState(mockContacts);
  const [stewards, setStewards] = useState(mockStewards);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [photosTaken, setPhotosTaken] = useState(0);
  const [cancelTaps, setCancelTaps] = useState(0);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [elapsed, setElapsed] = useState(0);

  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordingInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const photoInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimers = useCallback(() => {
    if (holdTimer.current) clearTimeout(holdTimer.current);
    if (progressInterval.current) clearInterval(progressInterval.current);
    holdTimer.current = null;
    progressInterval.current = null;
  }, []);

  const triggerPanic = useCallback(() => {
    setPanicActive(true);
    setProgress(100);
    setHolding(false);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setCoords({ lat: -33.9249, lng: 18.4241 })
      );
    } else {
      setCoords({ lat: -33.9249, lng: 18.4241 });
    }

    mockContacts.forEach((_, i) => {
      setTimeout(() => {
        setContacts(prev => prev.map((c, j) => j <= i ? { ...c, notified: true } : c));
      }, 800 * (i + 1));
    });

    mockStewards.forEach((_, i) => {
      setTimeout(() => {
        setStewards(prev => prev.map((s, j) => j <= i ? { ...s, notified: true } : s));
      }, 1200 * (i + 1) + 2000);
    });

    recordingInterval.current = setInterval(() => {
      setRecordingSeconds(prev => {
        if (prev >= 60) {
          if (recordingInterval.current) clearInterval(recordingInterval.current);
          return 60;
        }
        return prev + 1;
      });
    }, 1000);

    photoInterval.current = setInterval(() => {
      setPhotosTaken(prev => prev + 1);
    }, 10000);

    elapsedInterval.current = setInterval(() => {
      setElapsed(prev => prev + 1);
    }, 1000);

    toast.error('SOS · ACTIVE · BROADCAST_INITIATED', { duration: 5000 });
  }, []);

  const handleHoldStart = useCallback(() => {
    if (panicActive) return;
    setHolding(true);
    setProgress(0);
    try { navigator.vibrate?.([20]); } catch {}

    const startTime = Date.now();
    progressInterval.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min((elapsed / 1500) * 100, 100);
      setProgress(pct);
      if (pct >= 100) {
        clearTimers();
        try { navigator.vibrate?.([100, 50, 100, 50, 200]); } catch {}
        triggerPanic();
      }
    }, 30);
  }, [panicActive, clearTimers, triggerPanic]);

  const handleHoldEnd = useCallback(() => {
    if (!panicActive) {
      setHolding(false);
      setProgress(0);
      clearTimers();
    }
  }, [panicActive, clearTimers]);

  const handleCancel = useCallback(() => {
    setCancelTaps(prev => {
      const next = prev + 1;
      if (next >= 3) {
        setPanicActive(false);
        setProgress(0);
        setContacts(mockContacts);
        setStewards(mockStewards);
        setRecordingSeconds(0);
        setPhotosTaken(0);
        setCoords(null);
        setCancelTaps(0);
        setElapsed(0);
        if (recordingInterval.current) clearInterval(recordingInterval.current);
        if (photoInterval.current) clearInterval(photoInterval.current);
        if (elapsedInterval.current) clearInterval(elapsedInterval.current);
        toast.success('SOS · TERMINATED');
        return 0;
      }
      toast.warning(`CANCEL · CONFIRM_${3 - next}_MORE`);
      return next;
    });
  }, []);

  useEffect(() => {
    return () => {
      clearTimers();
      if (recordingInterval.current) clearInterval(recordingInterval.current);
      if (photoInterval.current) clearInterval(photoInterval.current);
      if (elapsedInterval.current) clearInterval(elapsedInterval.current);
    };
  }, [clearTimers]);

  const fmtTime = (s: number) => `T+${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  const notifiedContacts = contacts.filter(c => c.notified).length;
  const notifiedStewards = stewards.filter(s => s.notified).length;

  // ============= TACTICAL SOS OVERLAY =============
  if (panicActive) {
    return (
      <div className="fixed inset-0 z-[9999] bg-background flex flex-col page-animate">
        {/* Tactical grid + scanline overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.07]"
          style={{
            backgroundImage:
              'linear-gradient(hsl(var(--accent-threat)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--accent-threat)) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.04]"
          style={{
            backgroundImage: 'repeating-linear-gradient(0deg, hsl(var(--accent-threat)) 0px, hsl(var(--accent-threat)) 1px, transparent 1px, transparent 3px)',
          }}
        />

        {/* HEADER — RED ALERT BAR */}
        <div className="relative bg-accent-threat/12 border-b-2 border-accent-threat px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 bg-accent-threat animate-pulse" />
              <div className="font-mono text-[10px] tracking-[0.15em] text-accent-threat">
                SOS · ACTIVE · {fmtTime(elapsed)}
              </div>
            </div>
            <div className="font-mono text-[10px] tracking-[0.15em] text-accent-threat/70">
              BROADCAST_TIER_1
            </div>
          </div>
          <div className="mt-2 font-mono text-[10px] tracking-[0.15em] text-foreground/60">
            GPS · {coords ? `${coords.lat.toFixed(5)} / ${coords.lng.toFixed(5)}` : 'ACQUIRING...'}
          </div>
        </div>

        {/* CONTENT */}
        <div className="relative flex-1 overflow-auto">
          <div className="p-4 space-y-4 max-w-[480px] mx-auto">

            {/* TRUSTED NETWORK */}
            <section>
              <div className="flex items-center justify-between mb-2 px-1">
                <div className="font-mono text-[10px] tracking-[0.15em] text-foreground/40">
                  ▸ TRUSTED_NETWORK
                </div>
                <div className="font-mono text-[10px] tracking-[0.15em] text-accent-safe">
                  {notifiedContacts}/{contacts.length} ACK
                </div>
              </div>
              <div className="border border-border/30 divide-y divide-border/30">
                {contacts.map((c) => (
                  <div key={c.name} className="flex items-center justify-between px-3 py-2.5">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={cn(
                        "w-1.5 h-1.5 shrink-0",
                        c.notified ? "bg-accent-safe" : "bg-accent-warning animate-pulse"
                      )} />
                      <div className="min-w-0">
                        <div className="font-mono text-[11px] tracking-wider text-foreground truncate">{c.name}</div>
                        <div className="font-mono text-[9px] tracking-[0.15em] text-foreground/40">{c.role}</div>
                      </div>
                    </div>
                    <div className={cn(
                      "font-mono text-[9px] tracking-[0.15em] px-2 py-1 border",
                      c.notified
                        ? "text-accent-safe border-accent-safe/40 bg-accent-safe/5"
                        : "text-accent-warning border-accent-warning/40 bg-accent-warning/5"
                    )}>
                      {c.notified ? 'ACK' : 'SENDING'}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* COMMUNITY STEWARDS */}
            <section>
              <div className="flex items-center justify-between mb-2 px-1">
                <div className="font-mono text-[10px] tracking-[0.15em] text-foreground/40">
                  ▸ STEWARDS · 500m_RADIUS
                </div>
                <div className="font-mono text-[10px] tracking-[0.15em] text-accent-safe">
                  {notifiedStewards}/{stewards.length} LOCATED
                </div>
              </div>
              <div className="border border-border/30 divide-y divide-border/30">
                {stewards.map((s) => (
                  <div key={s.name} className="flex items-center justify-between px-3 py-2.5">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={cn(
                        "w-1.5 h-1.5 shrink-0",
                        s.notified ? "bg-accent-safe" : "bg-accent-info animate-pulse"
                      )} />
                      <div className="min-w-0">
                        <div className="font-mono text-[11px] tracking-wider text-foreground truncate">{s.name}</div>
                        <div className="font-mono text-[9px] tracking-[0.15em] text-foreground/40">DIST · {s.distance}m</div>
                      </div>
                    </div>
                    <div className={cn(
                      "font-mono text-[9px] tracking-[0.15em] px-2 py-1 border",
                      s.notified
                        ? "text-accent-safe border-accent-safe/40 bg-accent-safe/5"
                        : "text-accent-info border-accent-info/40 bg-accent-info/5"
                    )}>
                      {s.notified ? 'ALERTED' : 'LOCATING'}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* EVIDENCE COLLECTION */}
            <section>
              <div className="mb-2 px-1 font-mono text-[10px] tracking-[0.15em] text-foreground/40">
                ▸ EVIDENCE_CAPTURE · LIVE
              </div>
              <div className="grid grid-cols-3 gap-px bg-border/30 border border-border/30">
                <div className="bg-background p-3">
                  <div className="font-mono text-[9px] tracking-[0.15em] text-foreground/40 mb-1">AUDIO</div>
                  <div className="font-mono text-[18px] tabular-nums text-accent-threat">{recordingSeconds}<span className="text-[10px] text-foreground/40">/60s</span></div>
                  <div className="mt-2 h-0.5 bg-border/30">
                    <div className="h-full bg-accent-threat transition-all" style={{ width: `${(recordingSeconds / 60) * 100}%` }} />
                  </div>
                </div>
                <div className="bg-background p-3">
                  <div className="font-mono text-[9px] tracking-[0.15em] text-foreground/40 mb-1">PHOTO</div>
                  <div className="font-mono text-[18px] tabular-nums text-accent-threat">{photosTaken}<span className="text-[10px] text-foreground/40"> shots</span></div>
                  <div className="mt-2 font-mono text-[9px] tracking-[0.15em] text-foreground/40">+10s INTERVAL</div>
                </div>
                <div className="bg-background p-3">
                  <div className="font-mono text-[9px] tracking-[0.15em] text-foreground/40 mb-1">GPS</div>
                  <div className="font-mono text-[14px] tabular-nums text-accent-safe leading-tight">
                    {coords ? coords.lat.toFixed(3) : '--.---'}
                  </div>
                  <div className="font-mono text-[14px] tabular-nums text-accent-safe leading-tight">
                    {coords ? coords.lng.toFixed(3) : '--.---'}
                  </div>
                </div>
              </div>
            </section>

            {/* STATUS LOG */}
            <section>
              <div className="mb-2 px-1 font-mono text-[10px] tracking-[0.15em] text-foreground/40">
                ▸ EVENT_LOG
              </div>
              <div className="border border-border/30 bg-background p-3 space-y-1 font-mono text-[10px] tracking-wider">
                <div className="text-accent-safe">[{fmtTime(0)}] SOS · TRIGGERED</div>
                <div className="text-accent-safe">[{fmtTime(1)}] GPS · LOCKED</div>
                <div className="text-accent-safe">[{fmtTime(1)}] AUDIO · RECORDING</div>
                {notifiedContacts > 0 && <div className="text-accent-info">[{fmtTime(2)}] NETWORK · {notifiedContacts}_CONTACTS_NOTIFIED</div>}
                {notifiedStewards > 0 && <div className="text-accent-info">[{fmtTime(4)}] STEWARDS · {notifiedStewards}_RESPONDING</div>}
                {photosTaken > 0 && <div className="text-foreground/60">[{fmtTime(elapsed)}] EVIDENCE · {photosTaken}_PHOTOS_CAPTURED</div>}
                <div className="text-accent-threat animate-pulse">[{fmtTime(elapsed)}] ▸ BROADCAST_LIVE</div>
              </div>
            </section>
          </div>
        </div>

        {/* CANCEL FOOTER */}
        <div className="relative border-t-2 border-accent-threat bg-background">
          <div className="max-w-[480px] mx-auto p-4">
            <button
              onClick={handleCancel}
              className="w-full h-14 bg-accent-threat/10 border-2 border-accent-threat hover:bg-accent-threat/20 transition-colors group"
            >
              <div className="font-mono text-[11px] tracking-[0.2em] text-accent-threat font-bold">
                ⏻ TERMINATE_SOS
              </div>
              <div className="font-mono text-[9px] tracking-[0.15em] text-accent-threat/60 mt-0.5">
                CONFIRM · TAP_{3 - cancelTaps}_MORE_TIMES
              </div>
            </button>
            <div className="mt-2 flex justify-center gap-1">
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  className={cn(
                    "h-0.5 w-8 transition-colors",
                    i < cancelTaps ? "bg-accent-threat" : "bg-border/40"
                  )}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============= TACTICAL SOS BUTTON =============
  return (
    <div
      className="fixed z-[9999] left-4 md:left-auto md:right-6 md:bottom-6"
      style={{ bottom: 'calc(3.5rem + env(safe-area-inset-bottom, 0px) + 16px)' }}
    >
      <button
        onMouseDown={handleHoldStart}
        onMouseUp={handleHoldEnd}
        onMouseLeave={handleHoldEnd}
        onTouchStart={handleHoldStart}
        onTouchEnd={handleHoldEnd}
        className={cn(
          "relative w-[64px] h-[64px] bg-accent-threat text-white",
          "flex items-center justify-center",
          "border-2 border-accent-threat",
          "transition-transform duration-150",
          holding ? "scale-110" : "hover:scale-105",
          !holding && "sos-ring active"
        )}
        style={{ borderRadius: 0 }}
        aria-label="SOS Panic Button — hold for 1.5 seconds"
      >
        {/* Corner crosshairs */}
        <span className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white/80" />
        <span className="absolute top-0 right-0 w-2 h-2 border-t border-r border-white/80" />
        <span className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-white/80" />
        <span className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white/80" />

        {/* Progress bar (bottom edge) when holding */}
        {holding && (
          <span
            className="absolute bottom-0 left-0 h-1 bg-white transition-[width] duration-75 ease-linear"
            style={{ width: `${progress}%` }}
          />
        )}

        <span className="relative z-10 font-mono text-[13px] font-bold tracking-[0.15em]">SOS</span>
      </button>
      {holding && (
        <div className="absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap font-mono text-[9px] font-bold tracking-[0.2em] text-accent-threat bg-background border border-accent-threat px-2 py-1">
          HOLD · {Math.round(progress)}%
        </div>
      )}
    </div>
  );
});

PanicButton.displayName = 'PanicButton';
export default PanicButton;
