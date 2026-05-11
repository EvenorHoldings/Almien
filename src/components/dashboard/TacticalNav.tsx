import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Shield, MapPin, Navigation, Users, CircleUser } from 'lucide-react';
import { cn } from '@/lib/utils';

export type TacticalTab = 'home' | 'map' | 'routes' | 'network' | 'me';

interface Props {
  active: TacticalTab;
  onNavigate: (tab: TacticalTab) => void;
  onSos?: () => void;
}

const tabs: { id: TacticalTab; label: string; Icon: typeof Shield }[] = [
  { id: 'home',    label: 'HOME',    Icon: Shield },
  { id: 'map',     label: 'MAP',     Icon: MapPin },
  { id: 'routes',  label: 'ROUTES',  Icon: Navigation },
  { id: 'network', label: 'NETWORK', Icon: Users },
  { id: 'me',      label: 'ME',      Icon: CircleUser },
];

const HOLD_MS = 2000;

const TacticalNav = memo(({ active, onNavigate, onSos }: Props) => {
  const [holdProgress, setHoldProgress] = useState(0); // 0..1
  const [armed, setArmed] = useState(false);
  const startRef = useRef<number | null>(null);
  const rafRef = useRef<number>();

  const cancel = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    startRef.current = null;
    setHoldProgress(0);
  }, []);

  const startHold = useCallback(() => {
    startRef.current = performance.now();
    const tick = (now: number) => {
      if (startRef.current === null) return;
      const elapsed = now - startRef.current;
      const p = Math.min(elapsed / HOLD_MS, 1);
      setHoldProgress(p);
      if (p >= 1) {
        setArmed(true);
        try { navigator.vibrate?.([30, 20, 30]); } catch { /* noop */ }
        onSos?.();
        cancel();
      } else {
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [cancel, onSos]);

  useEffect(() => () => cancel(), [cancel]);

  // Progress ring math (28r → C ≈ 175.93)
  const r = 32;
  const c = 2 * Math.PI * r;
  const dash = c - holdProgress * c;

  return (
    <>
      {/* Fixed 72px SOS — anchored above the nav row, NOT inside it */}
      <button
        onPointerDown={startHold}
        onPointerUp={cancel}
        onPointerLeave={cancel}
        onPointerCancel={cancel}
        aria-label="Hold for 2 seconds to send SOS"
        className={cn('sos-ring fixed z-[9999]', armed && 'active')}
        style={{
          right: 20,
          bottom: 'calc(env(safe-area-inset-bottom, 0px) + 68px)',
        }}
      >
        {/* Hold-progress ring overlay */}
        {holdProgress > 0 && (
          <svg className="absolute inset-0 -rotate-90" width="72" height="72" viewBox="0 0 72 72" pointerEvents="none">
            <circle cx="36" cy="36" r={r} stroke="rgba(255,255,255,0.85)" strokeWidth="3" fill="none" strokeLinecap="round"
              strokeDasharray={c} strokeDashoffset={dash} />
          </svg>
        )}
        <span className="relative">SOS</span>
      </button>

      {/* Bottom nav rail */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-[9998] bg-black border-t border-[#1A1A1A]"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        aria-label="Primary"
      >
        <div className="mx-auto max-w-[430px] grid grid-cols-5 h-[56px]">
          {tabs.map(({ id, label, Icon }) => {
            const isActive = active === id;
            return (
              <button
                key={id}
                onClick={() => {
                  onNavigate(id);
                  try { navigator.vibrate?.(8); } catch { /* noop */ }
                }}
                className="relative flex flex-col items-center justify-center gap-1 min-h-[44px] focus:outline-none"
                aria-label={label}
                aria-current={isActive ? 'page' : undefined}
              >
                {isActive && (
                  <span
                    className="absolute top-0 w-4 h-[2px] bg-[#7C3AED]"
                    aria-hidden
                  />
                )}
                <Icon
                  size={22}
                  strokeWidth={2}
                  color={isActive ? '#7C3AED' : '#333'}
                />
                <span
                  className="text-[9px]"
                  style={{
                    color: isActive ? '#7C3AED' : '#333',
                    fontWeight: isActive ? 600 : 500,
                    fontFamily: 'DM Sans, sans-serif',
                    letterSpacing: '0.05em',
                  }}
                >
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
});

TacticalNav.displayName = 'TacticalNav';
export default TacticalNav;
