import { memo, useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, MapPin, Plus, Menu, Locate, Wifi, WifiOff, Activity, Plane } from 'lucide-react';
import AccountMenu from '@/components/auth/AccountMenu';
import { useUserLocation } from '@/hooks/useUserLocation';

type ConnectionStatus = 'live' | 'syncing' | 'offline';

type ThreatLevel = 'low' | 'elevated' | 'high' | 'critical';

interface SavedZone {
  id: string;
  name: string;
  threatLevel: ThreatLevel;
  label?: string;
}

interface ThreatHeaderProps {
  suburb?: string;
  threatLevel?: ThreatLevel;
  incidentCount?: number;
  connectionStatus?: ConnectionStatus;
  onBrowseAllAreas?: () => void;
  onMenuOpen?: () => void;
  onSafiEmergency?: () => void;
  isTravelerMode?: boolean;
  onToggleTravelerMode?: () => void;
}

const levelConfig: Record<ThreatLevel, { label: string; pillBg: string; pillText: string; headerBg: string; barColor: string; pulse?: boolean }> = {
  low: {
    label: 'LOW',
    pillBg: 'bg-accent-safe/15',
    pillText: 'text-accent-safe',
    headerBg: 'bg-surface-base',
    barColor: 'bg-accent-safe',
  },
  elevated: {
    label: 'ELEVATED',
    pillBg: 'bg-accent-warning/15',
    pillText: 'text-accent-warning',
    headerBg: 'bg-surface-base',
    barColor: 'bg-accent-warning',
  },
  high: {
    label: 'HIGH',
    pillBg: 'bg-accent-threat/15',
    pillText: 'text-accent-threat',
    headerBg: 'bg-surface-base',
    barColor: 'bg-accent-threat',
  },
  critical: {
    label: 'CRITICAL',
    pillBg: 'bg-accent-threat/15',
    pillText: 'text-accent-threat',
    headerBg: 'bg-surface-deep',
    barColor: 'bg-accent-threat',
    pulse: true,
  },
};

const defaultSavedZones: SavedZone[] = [
  { id: '1', name: 'Sea Point', threatLevel: 'elevated', label: 'Home' },
  { id: '2', name: 'Cape Town CBD', threatLevel: 'high', label: 'Work' },
  { id: '3', name: 'Camps Bay', threatLevel: 'low' },
];

const ThreatHeader = memo(({
  suburb,
  threatLevel = 'elevated',
  incidentCount = 7,
  connectionStatus = 'live',
  onBrowseAllAreas,
  onMenuOpen,
  onSafiEmergency,
  isTravelerMode = false,
  onToggleTravelerMode,
}: ThreatHeaderProps) => {
  const userLoc = useUserLocation();
  const detectedSuburb =
    userLoc.nearestArea?.name ?? userLoc.nearestSuburb?.suburb_name ?? suburb ?? 'Sea Point';

  const config = levelConfig[threatLevel];
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [activeZone, setActiveZone] = useState<string>(detectedSuburb);
  const [now, setNow] = useState(() => new Date());
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Live clock — desktop time pill only (1s tick)
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Sync activeZone with detected location once it resolves
  useEffect(() => {
    if (detectedSuburb && activeZone === 'Sea Point' && detectedSuburb !== 'Sea Point') {
      setActiveZone(detectedSuburb);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detectedSuburb]);

  useEffect(() => {
    if (!dropdownOpen) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [dropdownOpen]);

  const handleZoneSelect = (zone: SavedZone) => {
    setActiveZone(zone.name);
    setDropdownOpen(false);
  };

  const handleUseMyLocation = () => {
    userLoc.refresh();
    setActiveZone(detectedSuburb);
    setDropdownOpen(false);
  };

  // v5.1 — map internal threat level to the universal badge vocabulary
  const badgeClass =
    threatLevel === 'low' ? 'badge badge-safe'
    : threatLevel === 'elevated' ? 'badge badge-elevated'
    : 'badge badge-threat';
  const badgeLabel =
    threatLevel === 'low' ? 'CLEAR'
    : threatLevel === 'elevated' ? 'ELEVATED'
    : threatLevel === 'high' ? 'HIGH'
    : 'CRITICAL';

  return (
    <div className={cn(
      "h-[52px] shrink-0 flex items-center justify-between px-4 border-b border-border-subtle z-50 relative",
      config.headerBg
    )}>
      {/* Left accent bar */}
      <div className={cn("absolute left-0 top-0 bottom-0 w-[3px] rounded-r", config.barColor, config.pulse && "animate-pulse")} />

      {/* Left — menu button + tappable suburb switcher */}
      <div className="flex items-center gap-2 min-w-0 relative pl-2" ref={dropdownRef}>
        {onMenuOpen && (
          <button
            onClick={onMenuOpen}
            className="p-1.5 -ml-1 rounded-lg hover:bg-secondary min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5 text-foreground" />
          </button>
        )}
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-1.5 min-w-0 hover:opacity-80 transition-opacity"
        >
          <span className="text-sm font-bold text-foreground truncate">{activeZone}</span>
          <ChevronDown className={cn(
            "w-3.5 h-3.5 text-muted-foreground transition-transform shrink-0",
            dropdownOpen && "rotate-180"
          )} />
        </button>
        {/* v5.1 unified status badge */}
        <span className={cn(badgeClass, "shrink-0", config.pulse && "animate-pulse")}>
          {badgeLabel}
        </span>

        {/* Inline dropdown */}
        {dropdownOpen && (
          <div className="absolute top-full left-0 mt-1 w-64 bg-surface-02 border border-border-subtle rounded-xl z-50 animate-fade-in overflow-hidden">
            {/* My Location row */}
            <button
              onClick={handleUseMyLocation}
              className="w-full flex items-center gap-2.5 px-3 py-2 border-b border-border-subtle hover:bg-secondary transition-colors text-left"
            >
              <Locate className="w-3.5 h-3.5 text-accent-safe shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-accent-safe truncate">📍 My Location</p>
                <p className="text-[9px] text-muted-foreground truncate">
                  {userLoc.loading ? 'Detecting…' : userLoc.permissionDenied ? 'Permission denied — using default' : detectedSuburb}
                </p>
              </div>
            </button>
            <div className="p-1.5 space-y-0.5">
              {defaultSavedZones.map(z => {
                const isActive = z.name === activeZone;
                const zConfig = levelConfig[z.threatLevel];
                return (
                  <button
                    key={z.id}
                    onClick={() => handleZoneSelect(z)}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors",
                      isActive ? "bg-accent-safe/10" : "hover:bg-secondary"
                    )}
                  >
                    <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">{z.name}</p>
                      {z.label && <p className="text-[9px] text-muted-foreground">{z.label}</p>}
                    </div>
                    <span className={cn(
                      "px-1.5 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-system shrink-0",
                      zConfig.pillBg,
                      zConfig.pillText
                    )}>
                      {zConfig.label}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="border-t border-border-subtle p-1.5">
              <button
                onClick={() => { setDropdownOpen(false); onBrowseAllAreas?.(); }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left hover:bg-secondary transition-colors"
              >
                <Plus className="w-3.5 h-3.5 text-accent-safe shrink-0" />
                <span className="text-xs font-medium text-accent-safe">Browse All Areas</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Right side — Traveler · Safi · connection · incidents · time */}
      <div className="flex items-center gap-2 shrink-0">
        {onToggleTravelerMode && (
          <button
            onClick={onToggleTravelerMode}
            aria-label={isTravelerMode ? 'Exit traveler mode' : 'Enter traveler mode'}
            aria-pressed={isTravelerMode}
            title={isTravelerMode ? 'Exit traveler mode' : 'Traveler mode (simplified emergency view)'}
            className={cn(
              'flex items-center gap-1 h-7 px-2 rounded-full font-mono text-[9px] font-bold tracking-system transition-colors border',
              isTravelerMode
                ? 'bg-accent-threat/20 text-accent-threat border-accent-threat/60 animate-pulse'
                : 'bg-surface-02 text-foreground border-border-subtle hover:border-accent-safe/60 hover:text-accent-safe'
            )}
          >
            <Plane className="w-3 h-3" />
            <span className="hidden sm:inline">{isTravelerMode ? 'EXIT' : 'TRAVELER'}</span>
          </button>
        )}

        {onSafiEmergency && (
          <button
            onClick={onSafiEmergency}
            className="md:hidden flex items-center gap-1 px-2 h-7 rounded-full bg-accent-safe/15 hover:bg-accent-safe/25 transition-colors"
            aria-label="Safi emergency"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-accent-safe animate-pulse" />
            <span className="font-neural text-[10px] font-bold text-accent-safe">✦</span>
          </button>
        )}

        {/* Connection indicator — icon-only on mobile, label on sm+ */}
        <div
          className={cn(
            "flex items-center gap-1 h-7 px-1.5 sm:px-2 rounded-full font-mono text-[9px] font-bold tracking-system",
            connectionStatus === 'live' && "bg-accent-safe/12 text-accent-safe",
            connectionStatus === 'syncing' && "bg-accent-warning/15 text-accent-warning",
            connectionStatus === 'offline' && "bg-accent-threat/15 text-accent-threat"
          )}
          title={
            connectionStatus === 'live' ? 'Realtime feed connected'
            : connectionStatus === 'syncing' ? 'Syncing data…'
            : 'Offline — using cached data'
          }
        >
          {connectionStatus === 'live' && <Wifi className="w-3 h-3" />}
          {connectionStatus === 'syncing' && <Activity className="w-3 h-3 animate-pulse" />}
          {connectionStatus === 'offline' && <WifiOff className="w-3 h-3" />}
          <span className="hidden sm:inline">
            {connectionStatus === 'live' ? 'LIVE' : connectionStatus === 'syncing' ? 'SYNC' : 'OFFLINE'}
          </span>
        </div>

        {/* Incident count — kept compact, hidden on tiny screens */}
        <span className="hidden xs:inline text-xs text-muted-foreground tabular-nums shrink-0">
          <span className="font-bold text-foreground">{incidentCount}</span>
          <span className="hidden sm:inline"> incidents</span>
        </span>

        {/* Time pill — desktop only */}
        <div className="hidden md:flex items-center gap-1.5 h-7 pl-2 pr-2.5 rounded-full bg-surface-02 border border-border-subtle">
          <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-system">
            {now.toLocaleDateString('en-ZA', { weekday: 'short' })}
          </span>
          <span className="text-[11px] font-mono font-bold text-foreground tabular-nums">
            {now.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <AccountMenu />
      </div>
    </div>
  );
});

ThreatHeader.displayName = 'ThreatHeader';
export default ThreatHeader;
