import { memo, useState } from 'react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import ThemeToggle from '@/components/ThemeToggle';
import {
  Home, MapPin, Target, Car, Mountain,
  Phone, Briefcase, Users, Bell, Settings, Crown, Shield, User, X,
  TrafficCone, Lightbulb, Plane, Landmark, TrendingUp, Leaf, Accessibility, Moon,
  Wrench, Gauge, Activity, FileCheck, CloudRain, Factory, Zap, HeartHandshake, Award,
  ShieldAlert, Code, Heart, GraduationCap, Store, Map, Navigation,
  Brain, MessageSquare, Pin, PinOff
} from 'lucide-react';
import type { ViewId } from './AlmienDashboard';

interface AlmienSidebarProps {
  activeView: ViewId;
  onNavigate: (view: ViewId) => void;
  onUpgrade: () => void;
  isOpen: boolean;
  onToggle: () => void;
  isMobile: boolean;
}

const menuGroups: { label: string; items: { id: ViewId; label: string; icon: typeof Home; elite?: boolean }[] }[] = [
  {
    label: '',
    items: [
      { id: 'dashboard', label: 'Home', icon: Home },
      { id: 'map-full', label: 'Map', icon: Map },
      { id: 'safe-route', label: 'Routes', icon: Navigation },
    ],
  },
  {
    label: 'Safety',
    items: [
      { id: 'safety-overview', label: 'Safety Overview', icon: Shield },
      { id: 'safe-space', label: 'Safe Space', icon: Heart },
      { id: 'emergency', label: 'Emergency', icon: Phone },
      { id: 'safety-network', label: 'My Network', icon: Users },
      { id: 'alerts', label: 'Alerts', icon: Bell, elite: true },
      { id: 'community', label: 'Community Intel', icon: Users },
      { id: 'business-safety', label: 'Business Safety', icon: Store },
      { id: 'sa-crime-layer', label: 'SA Crime Stats', icon: ShieldAlert },
    ],
  },
  {
    label: 'Intelligence',
    items: [
      { id: 'predictive', label: 'Guardian AI', icon: Brain },
      { id: 'darkness-windows', label: 'Dark Zones', icon: Zap },
      { id: 'neural-profile', label: 'Neural Profile', icon: Brain },
      { id: 'dark-zones', label: 'Dark Zone Intel', icon: ShieldAlert },
      { id: 'safi-history', label: 'Safi History', icon: MessageSquare },
      { id: 'vehicle-crime', label: 'Vehicle Crime', icon: Car },
      { id: 'school-safety', label: 'School Safety', icon: GraduationCap },
      { id: 'municipal-scorecard', label: 'Municipal Scorecard', icon: Award, elite: true },
    ],
  },
  {
    label: 'City',
    items: [
      { id: 'traffic', label: 'Traffic & Transport', icon: TrafficCone },
      { id: 'utilities', label: 'Utilities', icon: Lightbulb },
      { id: 'airport', label: 'Airport', icon: Plane },
      { id: 'government', label: 'Government', icon: Landmark },
      { id: 'utility-insights', label: 'Utility Insights', icon: Gauge },
      { id: 'microclimate', label: 'Microclimate', icon: CloudRain },
      { id: 'carbon-dashboard', label: 'Carbon', icon: Factory },
      { id: 'resilience', label: 'Resilience', icon: Activity },
      { id: 'volunteer-match', label: 'Volunteer', icon: HeartHandshake },
    ],
  },
  {
    label: 'Explore',
    items: [
      { id: 'activities', label: 'Activities', icon: Target },
      { id: 'trails', label: 'Trails', icon: Mountain },
      { id: 'rideshare', label: 'Rideshare', icon: Car },
      { id: 'tourism-hub', label: 'Tourism', icon: MapPin },
      { id: 'night-economy', label: 'Night Economy', icon: Moon },
      { id: 'accessibility', label: 'Accessibility', icon: Accessibility },
      { id: 'biodiversity', label: 'Biodiversity', icon: Leaf },
    ],
  },
  {
    label: 'Pro Tools',
    items: [
      { id: 'pro-tools', label: 'Professional Tools', icon: Briefcase },
      { id: 'pred-maintenance', label: 'Predictive Maintenance', icon: Wrench },
      { id: 'traffic-optimizer', label: 'Traffic Optimizer', icon: TrendingUp },
      { id: 'exposure-tracker', label: 'Exposure Tracker', icon: Activity },
      { id: 'permit-reviewer', label: 'Permit Reviewer', icon: FileCheck },
      { id: 'api-hub', label: 'API Hub', icon: Code },
    ],
  },
  {
    label: '',
    items: [
      { id: 'profile', label: 'Profile', icon: User },
      { id: 'settings', label: 'Settings', icon: Settings },
    ],
  },
];

const AlmienSidebar = memo(({ activeView, onNavigate, onUpgrade, isOpen, onToggle, isMobile }: AlmienSidebarProps) => {
  const [pinned, setPinned] = useState(true);

  return (
    <aside className={cn(
      "flex flex-col bg-[hsl(var(--surface-base))] border-r border-[hsl(var(--border-subtle))] h-full shrink-0",
      "transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
      isMobile
        ? "fixed left-0 top-0 z-[86] w-[280px] max-w-[85vw] shadow-2xl"
        : pinned ? "w-[240px]" : "w-16 hover:w-[240px] group",
      isMobile && !isOpen && "-translate-x-full"
    )}>
      {/* Logo */}
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <Shield className="w-4 h-4 text-primary-foreground" />
          </div>
          <div className={cn("min-w-0", !isMobile && !pinned && "hidden group-hover:block")}>
            <h1 className="text-base font-extrabold tracking-tight text-foreground leading-none">Almien</h1>
            <p className="text-[10px] text-muted-foreground font-medium leading-none mt-0.5">Always Near</p>
          </div>
        </div>
        {isMobile ? (
          <button onClick={onToggle} className="p-1.5 rounded-lg hover:bg-secondary min-w-[44px] min-h-[44px] flex items-center justify-center">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        ) : (
          <button onClick={() => setPinned(!pinned)} className={cn("p-1.5 rounded-lg hover:bg-secondary", !pinned && "hidden group-hover:block")}>
            {pinned ? <PinOff className="w-3.5 h-3.5 text-muted-foreground" /> : <Pin className="w-3.5 h-3.5 text-muted-foreground" />}
          </button>
        )}
      </div>

      {/* Mini safety score (collapsed) — v5.1: glanceable score even at 64px */}
      {!isMobile && !pinned && (
        <div className="flex flex-col items-center py-3 group-hover:hidden">
          <div className="relative w-10 h-10">
            <svg viewBox="0 0 40 40" className="w-full h-full -rotate-90">
              <circle cx="20" cy="20" r="17" fill="none" stroke="hsl(var(--border-subtle))" strokeWidth="3" />
              <circle
                cx="20" cy="20" r="17" fill="none"
                stroke="hsl(var(--safe))" strokeWidth="3" strokeLinecap="round"
                strokeDasharray={`${(7.8 / 10) * 106.8} 106.8`}
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[11px] font-neural font-bold text-accent-safe">
              7.8
            </span>
          </div>
        </div>
      )}

      {/* Navigation */}
      <ScrollArea className="flex-1 px-2 py-3">
        <nav className="space-y-3">
          {menuGroups.map(group => (
            <div key={group.label || 'misc'}>
              {group.label && (
                <div className={cn(
                  // v5.1 — group labels in mono safe-tier accent for clearer hierarchy
                  "px-3 pb-1.5 font-neural text-[9px] font-bold uppercase tracking-[0.12em] text-accent-safe/70",
                  !isMobile && !pinned && "hidden group-hover:block"
                )}>{group.label}</div>
              )}
              <div className="space-y-0.5">
                {group.items.map(item => {
                  const isActive = activeView === item.id;
                  return (
                    <button
                      key={`${group.label}-${item.id}`}
                      onClick={() => onNavigate(item.id)}
                      className={cn(
                        "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors min-h-[44px]",
                        // v5.1 — keep border-left slot reserved on inactive items so click doesn't shift width
                        isActive
                          ? "bg-accent-safe/10 text-accent-safe border-l-2 border-accent-safe"
                          : "text-muted-foreground hover:text-foreground hover:bg-[hsl(var(--accent)/0.5)] border-l-2 border-transparent"
                      )}
                    >
                      <item.icon className={cn("w-[18px] h-[18px] shrink-0", isActive && "text-accent-safe")} />
                      <span className={cn("truncate", !isMobile && !pinned && "hidden group-hover:block")}>{item.label}</span>
                      {item.elite && (
                        <span className={cn(
                          "ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0",
                          !isMobile && !pinned && "hidden group-hover:block",
                          isActive ? "bg-accent-safe/20 text-accent-safe" : "bg-elite-gradient text-white"
                        )}>👑</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </ScrollArea>

      {/* Bottom section */}
      <div className={cn("p-3 space-y-2 border-t border-[hsl(var(--border-subtle))]", !isMobile && !pinned && "group-hover:p-3 p-1.5")}>
        <button
          onClick={onUpgrade}
          className={cn(
            "w-full p-3 rounded-xl bg-elite-gradient text-white text-left hover:opacity-90 transition-opacity",
            !isMobile && !pinned && "hidden group-hover:block"
          )}
        >
          <div className="flex items-center gap-2 mb-0.5">
            <Crown className="w-4 h-4" />
            <span className="text-xs font-bold">UPGRADE TO ELITE</span>
          </div>
          <p className="text-[10px] text-white/80">Real-time alerts, unlimited access</p>
        </button>

        <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg bg-[hsl(var(--secondary)/0.5)]">
          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <User className="w-3.5 h-3.5 text-primary" />
          </div>
          <div className={cn("flex-1 min-w-0", !isMobile && !pinned && "hidden group-hover:block")}>
            <div className="text-xs font-medium text-foreground truncate">Guest User</div>
            <div className="text-[10px] text-muted-foreground">Free Plan</div>
          </div>
          <div className={cn(!isMobile && !pinned && "hidden group-hover:block")}>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </aside>
  );
});

AlmienSidebar.displayName = 'AlmienSidebar';
export default AlmienSidebar;
