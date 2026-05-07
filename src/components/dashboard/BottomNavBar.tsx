import { memo, useState } from 'react';
import { cn } from '@/lib/utils';
import { Shield, MapPin, Users, User, Home } from 'lucide-react';
import type { ViewId } from './AlmienDashboard';

interface BottomNavBarProps {
  activeView: ViewId;
  onNavigate: (view: ViewId) => void;
  onSafiOpen?: () => void;
}

const tabs: { id: ViewId | 'safi'; label: string; icon: typeof Shield }[] = [
  { id: 'dashboard', label: 'Home', icon: Home },
  { id: 'map-full', label: 'Map', icon: MapPin },
  { id: 'safi', label: 'SAFI', icon: Shield }, // placeholder, rendered specially
  { id: 'community', label: 'Community', icon: Users },
  { id: 'profile', label: 'Profile', icon: User },
];

const BottomNavBar = memo(({ activeView, onNavigate, onSafiOpen }: BottomNavBarProps) => {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-[9998] bg-[hsl(var(--surface-base)/0.96)] backdrop-blur-xl border-t border-[hsl(var(--border-subtle))] w-full max-w-full"
      style={{ height: 'calc(3.5rem + env(safe-area-inset-bottom, 0px))', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex items-stretch justify-around h-14 max-w-lg mx-auto relative">
        {tabs.map((tab) => {
          // Centre Safi pill
          if (tab.id === 'safi') {
            return (
              <button
                key="safi"
                onClick={() => { onSafiOpen?.(); try { navigator.vibrate?.([10]); } catch {} }}
                className="relative flex flex-col items-center justify-center flex-1 min-w-[48px] -mt-2"
                aria-label="Open Safi AI"
              >
                <div className="w-[72px] h-[48px] rounded-full flex flex-col items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, hsl(var(--safi-from)), hsl(var(--safi-to)))' }}
                >
                  <span className="text-[14px] text-white leading-none">✦</span>
                  <span className="text-[9px] font-bold text-white font-neural leading-none mt-0.5">SAFI</span>
                </div>
              </button>
            );
          }

          const isActive = activeView === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                onNavigate(tab.id as ViewId);
                try { navigator.vibrate?.([10]); } catch {}
              }}
              className={cn(
                'relative flex flex-col items-center justify-center gap-0.5 flex-1 min-w-[48px] min-h-[44px]',
                'transition-colors duration-100',
                isActive ? 'text-accent-safe' : 'text-muted-foreground'
              )}
              aria-label={tab.label}
              aria-current={isActive ? 'page' : undefined}
            >
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-accent-safe" />
              )}
              <tab.icon
                className={cn("w-[22px] h-[22px] transition-transform", isActive ? "scale-110" : "w-5 h-5")}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span className={cn(
                isActive ? 'text-[10px] font-bold' : 'text-[9px] font-medium'
              )}>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
});

BottomNavBar.displayName = 'BottomNavBar';
export default BottomNavBar;
