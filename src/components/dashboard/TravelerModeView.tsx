import { useState } from 'react';
import { 
  Shield, Flame, Waves, Mountain, Phone, AlertTriangle, 
  Footprints, Bike, PersonStanding, Wind, Eye, MapPin, Building2, ShieldCheck
} from 'lucide-react';
import { touristSites, beachSafety } from '@/data/suburbIntelligence';
import { cn } from '@/lib/utils';
import { useSafeZones } from '@/hooks/useSafeZones';
import DemoBadge from '@/components/DemoBadge';

type MobilityProfile = 'walking' | 'cycling' | 'hiking';

interface SafeHaven {
  id: string;
  name: string;
  type: 'cid' | 'police';
  distance: string;
  address: string;
  contact: string;
}

interface CautionZone {
  id: string;
  name: string;
  risk: 'isolated' | 'low-visibility' | 'high-traffic';
  description: string;
}

// Mock data for Pickpocket Hot Zones
const pickpocketZones = [
  { id: '1', name: 'Long Street (Night)', risk: 'high', time: '20:00-02:00' },
  { id: '2', name: 'Cape Town Station', risk: 'high', time: 'Rush Hour' },
  { id: '3', name: 'Greenmarket Square', risk: 'medium', time: 'All Day' },
  { id: '4', name: 'St Georges Mall', risk: 'medium', time: 'Weekdays' },
];

// Mock data for Cycling Caution Zones
const cyclingCautionZones: CautionZone[] = [
  { id: '1', name: 'M3 Underpass', risk: 'isolated', description: 'Low foot traffic, poor lighting' },
  { id: '2', name: 'Tokai Forest Path', risk: 'low-visibility', description: 'Dense vegetation, limited sightlines' },
  { id: '3', name: 'Main Road Sea Point', risk: 'high-traffic', description: 'Heavy vehicle traffic' },
  { id: '4', name: 'Liesbeek Parkway', risk: 'isolated', description: 'Remote stretch near wetlands' },
];

// Mock wind/visibility data
const weatherConditions = {
  windSpeed: 28,
  windDirection: 'SE',
  visibility: 85,
  uvIndex: 7,
};

const TravelerModeView = () => {
  const { data: zones, isLoading: zonesLoading } = useSafeZones();
  const safeHavens: SafeHaven[] = (zones ?? [])
    .filter(z => z.contact_number)
    .sort((a, b) => Number(b.verified) - Number(a.verified) || b.safety_rating - a.safety_rating)
    .slice(0, 6)
    .map(z => ({
      id: z.id,
      name: z.name,
      type: z.zone_type === 'police_station' ? 'police' : 'cid',
      distance: z.is_24_hours ? '24h' : (z.neighborhood ?? ''),
      address: z.address,
      contact: z.contact_number ?? '',
    }));
  const [activeProfile, setActiveProfile] = useState<MobilityProfile>('walking');
  const hikingSites = touristSites.filter(site => site.type === 'hiking');
  const beachSites = beachSafety.slice(0, 4);

  const profileButtons: { id: MobilityProfile; label: string; icon: typeof Footprints }[] = [
    { id: 'walking', label: 'Walking', icon: Footprints },
    { id: 'cycling', label: 'Cycling', icon: Bike },
    { id: 'hiking', label: 'Hiking', icon: PersonStanding },
  ];

  return (
    <div className="min-h-screen bg-black px-4 py-6 pb-[200px]">
      <div className="max-w-lg mx-auto space-y-5">
        {/* Emergency Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <AlertTriangle className="w-6 h-6 text-red-400 animate-pulse" />
            <h1 className="text-2xl font-black text-white tracking-tight">TRAVELER MODE</h1>
            <AlertTriangle className="w-6 h-6 text-red-400 animate-pulse" />
          </div>
          <p className="text-muted-foreground text-sm">
            Simplified emergency access for tourists
          </p>
        </div>

        {/* Mobility Profile Selector - High Contrast for Sunlight */}
        <div className="bg-black border-2 border-white/30 rounded-2xl p-2">
          <div className="flex gap-2">
            {profileButtons.map((profile) => {
              const Icon = profile.icon;
              const isActive = activeProfile === profile.id;
              return (
                <button
                  key={profile.id}
                  onClick={() => setActiveProfile(profile.id)}
                  className={cn(
                    'flex-1 flex flex-col items-center gap-2 py-4 rounded-xl transition-all font-bold',
                    'border-2',
                    isActive 
                      ? 'bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.5)]'
                      : 'bg-black text-white border-white/30 hover:border-white/60'
                  )}
                >
                  <Icon className={cn(
                    'w-8 h-8',
                    isActive ? 'text-black' : 'text-white'
                  )} strokeWidth={2.5} />
                  <span className="text-sm tracking-wide uppercase">{profile.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Walking Profile Content */}
        {activeProfile === 'walking' && (
          <div className="space-y-4">
            {/* Pickpocket Hot Zones */}
            <div className="bg-card/50 backdrop-blur-md rounded-2xl border border-amber-500/50 overflow-hidden">
              <div className="bg-amber-500/30 px-4 py-3 border-b border-amber-500/50">
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <AlertTriangle className="w-5 h-5 text-amber-400" />
                    <div className="absolute inset-0 animate-ping">
                      <AlertTriangle className="w-5 h-5 text-amber-400 opacity-50" />
                    </div>
                  </div>
                  <h2 className="font-bold text-white uppercase tracking-wide">Pickpocket Hot Zones</h2>
                  <DemoBadge className="ml-auto" />
                </div>
              </div>
              <div className="p-4 space-y-2">
                {pickpocketZones.map(zone => (
                  <div 
                    key={zone.id} 
                    className={cn(
                      'flex items-center justify-between p-3 rounded-xl border',
                      zone.risk === 'high' 
                        ? 'bg-amber-500/20 border-amber-500/50' 
                        : 'bg-amber-500/10 border-amber-500/30'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'w-3 h-3 rounded-full animate-pulse',
                        zone.risk === 'high' ? 'bg-amber-400' : 'bg-amber-300'
                      )} />
                      <span className="font-medium text-white">{zone.name}</span>
                    </div>
                    <span className="text-xs font-mono text-amber-300 bg-black/30 px-2 py-1 rounded">
                      {zone.time}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Safe Havens */}
            <div className="bg-card/50 backdrop-blur-md rounded-2xl border border-emerald-500/50 overflow-hidden">
              <div className="bg-emerald-500/30 px-4 py-3 border-b border-emerald-500/50">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <h2 className="font-bold text-white uppercase tracking-wide">Nearest Safe Havens</h2>
                </div>
              </div>
              <div className="p-4 space-y-2">
                {zonesLoading && <p className="text-xs text-muted-foreground">Loading safe havens…</p>}
                {!zonesLoading && safeHavens.length === 0 && <p className="text-xs text-muted-foreground">No safe havens found.</p>}
                {safeHavens.map(haven => (
                  <a
                    key={haven.id}
                    href={`tel:${haven.contact.replace(/\s/g, '')}`}
                    className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {haven.type === 'cid' ? (
                        <Building2 className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <Shield className="w-5 h-5 text-blue-400" />
                      )}
                      <div>
                        <div className="font-medium text-white text-sm">{haven.name}</div>
                        <div className="text-xs text-muted-foreground">{haven.address}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-emerald-400 text-sm">{haven.distance}</div>
                      <div className="text-[10px] text-muted-foreground">{haven.contact}</div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Cycling Profile Content */}
        {activeProfile === 'cycling' && (
          <div className="space-y-4">
            {/* Wind & Visibility Meter */}
            <div className="bg-card/50 backdrop-blur-md rounded-2xl border border-sky-500/50 overflow-hidden">
              <div className="bg-sky-500/30 px-4 py-3 border-b border-sky-500/50">
                <div className="flex items-center gap-2">
                  <Wind className="w-5 h-5 text-sky-400" />
                  <h2 className="font-bold text-white uppercase tracking-wide">Wind & Visibility</h2>
                  <DemoBadge className="ml-auto" />
                </div>
              </div>
              <div className="p-4 grid grid-cols-2 gap-4">
                <div className="bg-black/50 rounded-xl p-4 border border-sky-500/30 text-center">
                  <Wind className="w-8 h-8 text-sky-400 mx-auto mb-2" />
                  <div className="font-mono text-3xl font-bold text-white">{weatherConditions.windSpeed}</div>
                  <div className="text-xs text-muted-foreground">km/h {weatherConditions.windDirection}</div>
                  <div className={cn(
                    'mt-2 text-xs font-bold px-2 py-1 rounded-full',
                    weatherConditions.windSpeed > 30 
                      ? 'bg-red-500/20 text-red-400' 
                      : weatherConditions.windSpeed > 20 
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-emerald-500/20 text-emerald-400'
                  )}>
                    {weatherConditions.windSpeed > 30 ? 'STRONG WIND' : weatherConditions.windSpeed > 20 ? 'MODERATE' : 'CALM'}
                  </div>
                </div>
                <div className="bg-black/50 rounded-xl p-4 border border-sky-500/30 text-center">
                  <Eye className="w-8 h-8 text-sky-400 mx-auto mb-2" />
                  <div className="font-mono text-3xl font-bold text-white">{weatherConditions.visibility}%</div>
                  <div className="text-xs text-muted-foreground">Visibility</div>
                  <div className={cn(
                    'mt-2 text-xs font-bold px-2 py-1 rounded-full',
                    weatherConditions.visibility < 50 
                      ? 'bg-red-500/20 text-red-400' 
                      : weatherConditions.visibility < 75 
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-emerald-500/20 text-emerald-400'
                  )}>
                    {weatherConditions.visibility < 50 ? 'POOR' : weatherConditions.visibility < 75 ? 'FAIR' : 'GOOD'}
                  </div>
                </div>
              </div>
            </div>

            {/* Caution Zones */}
            <div className="bg-card/50 backdrop-blur-md rounded-2xl border border-orange-500/50 overflow-hidden">
              <div className="bg-orange-500/30 px-4 py-3 border-b border-orange-500/50">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-400" />
                  <h2 className="font-bold text-white uppercase tracking-wide">Caution Zones</h2>
                  <DemoBadge className="ml-auto" />
                </div>
              </div>
              <div className="p-4 space-y-2">
                {cyclingCautionZones.map(zone => (
                  <div 
                    key={zone.id} 
                    className="flex items-center justify-between p-3 rounded-xl bg-orange-500/10 border border-orange-500/30"
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'w-3 h-3 rounded-full',
                        zone.risk === 'isolated' ? 'bg-orange-500' :
                        zone.risk === 'low-visibility' ? 'bg-yellow-500' : 'bg-red-500'
                      )} />
                      <div>
                        <div className="font-medium text-white text-sm">{zone.name}</div>
                        <div className="text-xs text-muted-foreground">{zone.description}</div>
                      </div>
                    </div>
                    <span className={cn(
                      'text-[10px] font-mono uppercase px-2 py-1 rounded',
                      zone.risk === 'isolated' ? 'bg-orange-500/20 text-orange-400' :
                      zone.risk === 'low-visibility' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'
                    )}>
                      {zone.risk}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Cycle Track Info */}
            <div className="bg-card/50 backdrop-blur-md rounded-2xl border border-emerald-500/50 p-4">
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="w-5 h-5 text-emerald-400" />
                <span className="font-bold text-white">Cycle-Friendly Routes</span>
              </div>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-1 bg-emerald-400 rounded" />
                  <span>Sea Point Promenade (8km)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-1 bg-emerald-400 rounded" />
                  <span>Green Point Urban Park (3km)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-1 bg-emerald-400 rounded" />
                  <span>Century City Canal (5km)</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Hiking Profile Content */}
        {activeProfile === 'hiking' && (
          <div className="space-y-4">
            {/* Hiking Guidelines */}
            <div className="bg-card/50 backdrop-blur-md rounded-2xl border border-amber-500/30 overflow-hidden">
              <div className="bg-amber-500/20 px-4 py-3 border-b border-amber-500/30">
                <div className="flex items-center gap-2">
                  <Mountain className="w-5 h-5 text-amber-400" />
                  <h2 className="font-bold text-foreground">Hiking Safety</h2>
                </div>
              </div>
              <div className="p-4 space-y-3">
                {hikingSites.slice(0, 3).map(site => (
                  <div key={site.id} className="bg-background/50 rounded-xl p-4 border border-border/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-foreground">{site.name}</span>
                      <span className={cn(
                        'text-sm font-bold',
                        site.safety_score >= 80 ? 'text-emerald-400' : 'text-yellow-400'
                      )}>
                        {site.safety_score}
                      </span>
                    </div>
                    <ul className="space-y-1">
                      {site.protocols.slice(0, 2).map((protocol, idx) => (
                        <li key={idx} className="text-xs text-muted-foreground flex items-start gap-2">
                          <span className="text-amber-400">•</span>
                          {protocol}
                        </li>
                      ))}
                    </ul>
                    <a
                      href={`tel:${site.emergency_contact.replace(/\s/g, '')}`}
                      className="mt-3 flex items-center gap-2 text-xs text-amber-400 hover:text-amber-300"
                    >
                      <Phone className="w-3 h-3" />
                      {site.emergency_name}: {site.emergency_contact}
                    </a>
                  </div>
                ))}
              </div>
            </div>

            {/* Beach Safety */}
            <div className="bg-card/50 backdrop-blur-md rounded-2xl border border-cyan-500/30 overflow-hidden">
              <div className="bg-cyan-500/20 px-4 py-3 border-b border-cyan-500/30">
                <div className="flex items-center gap-2">
                  <Waves className="w-5 h-5 text-cyan-400" />
                  <h2 className="font-bold text-foreground">Beach Safety</h2>
                </div>
              </div>
              <div className="p-4 space-y-3">
                {beachSites.map(beach => (
                  <div key={beach.id} className="flex items-center justify-between bg-background/50 rounded-xl p-3 border border-border/30">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'w-3 h-3 rounded-full',
                        beach.flag_status === 'green' ? 'bg-emerald-400' :
                        beach.flag_status === 'red' ? 'bg-red-400' :
                        beach.flag_status === 'black' ? 'bg-gray-800 border border-gray-600' :
                        'bg-white'
                      )} />
                      <div>
                        <div className="font-medium text-foreground text-sm">{beach.name}</div>
                        <div className="text-xs text-muted-foreground">{beach.primary_risk}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {beach.shark_spotter && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400 font-mono">SHARK SPOTTERS</span>
                      )}
                      {beach.lifeguards && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 font-mono">LIFEGUARDS</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Persistent Emergency SOS - One-Tap Dial */}
        <div className="space-y-3">
          <div className="text-center">
            <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
              One-Tap Emergency Dial
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <a
              href="tel:0214261325"
              className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-violet-600 hover:bg-violet-500 transition-all border-2 border-violet-400 shadow-lg shadow-violet-500/30 active:scale-95"
            >
              <Building2 className="w-10 h-10 text-white" strokeWidth={2.5} />
              <span className="font-bold text-white text-sm">CCID SECURITY</span>
              <span className="font-mono text-violet-100 text-xs">021 426 1325</span>
            </a>
            
            <a
              href="tel:0219370300"
              className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 transition-all border-2 border-emerald-400 shadow-lg shadow-emerald-500/30 active:scale-95"
            >
              <Mountain className="w-10 h-10 text-white" strokeWidth={2.5} />
              <span className="font-bold text-white text-sm">MTN RESCUE</span>
              <span className="font-mono text-emerald-100 text-xs">021 937 0300</span>
            </a>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <a
              href="tel:10111"
              className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-blue-600 hover:bg-blue-500 transition-all border-2 border-blue-400 shadow-lg shadow-blue-500/30 active:scale-95"
            >
              <Shield className="w-10 h-10 text-white" strokeWidth={2.5} />
              <span className="font-bold text-white text-sm">SAPS POLICE</span>
              <span className="font-mono text-blue-100 text-xs">10111</span>
            </a>
            
            <a
              href="tel:0870949774"
              className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-cyan-600 hover:bg-cyan-500 transition-all border-2 border-cyan-400 shadow-lg shadow-cyan-500/30 active:scale-95"
            >
              <Waves className="w-10 h-10 text-white" strokeWidth={2.5} />
              <span className="font-bold text-white text-sm">SEA RESCUE</span>
              <span className="font-mono text-cyan-100 text-xs">NSRI</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TravelerModeView;
