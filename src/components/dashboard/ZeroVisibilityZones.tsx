import { memo } from 'react';
import { AlertTriangle, Zap, Lightbulb, Eye, EyeOff, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import DemoBadge from '@/components/DemoBadge';

/**
 * Zero-Visibility Zones: Overlays loadshedding outages with
 * reported streetlight faults to identify dangerous dark corridors.
 */

interface ZeroVisZone {
  area: string;
  ward: number;
  loadsheddingActive: boolean;
  stage: number;
  faultyStreetlights: number;
  totalStreetlights: number;
  riskLevel: 'critical' | 'high' | 'moderate' | 'low';
  nextRestore?: string;
}

const mockZones: ZeroVisZone[] = [
  { area: 'Khayelitsha', ward: 95, loadsheddingActive: true, stage: 4, faultyStreetlights: 34, totalStreetlights: 120, riskLevel: 'critical', nextRestore: '22:30' },
  { area: 'Nyanga', ward: 37, loadsheddingActive: true, stage: 4, faultyStreetlights: 28, totalStreetlights: 85, riskLevel: 'critical', nextRestore: '22:30' },
  { area: 'Philippi', ward: 35, loadsheddingActive: true, stage: 4, faultyStreetlights: 19, totalStreetlights: 90, riskLevel: 'high', nextRestore: '22:30' },
  { area: 'Delft', ward: 21, loadsheddingActive: false, stage: 0, faultyStreetlights: 22, totalStreetlights: 75, riskLevel: 'high' },
  { area: 'Mitchells Plain', ward: 79, loadsheddingActive: true, stage: 4, faultyStreetlights: 11, totalStreetlights: 110, riskLevel: 'moderate', nextRestore: '22:30' },
  { area: 'Goodwood', ward: 2, loadsheddingActive: false, stage: 0, faultyStreetlights: 5, totalStreetlights: 95, riskLevel: 'low' },
];

const riskStyles = {
  critical: { bg: 'bg-destructive/15', border: 'border-destructive/40', text: 'text-destructive', badge: 'bg-destructive/20 text-destructive' },
  high: { bg: 'bg-safety-orange/15', border: 'border-safety-orange/40', text: 'text-safety-orange', badge: 'bg-safety-orange/20 text-safety-orange' },
  moderate: { bg: 'bg-safety-yellow/15', border: 'border-safety-yellow/40', text: 'text-safety-yellow', badge: 'bg-safety-yellow/20 text-safety-yellow' },
  low: { bg: 'bg-safety-green/15', border: 'border-safety-green/40', text: 'text-safety-green', badge: 'bg-safety-green/20 text-safety-green' },
};

const ZeroVisibilityZones = memo(() => {
  const criticalCount = mockZones.filter(z => z.riskLevel === 'critical' || z.riskLevel === 'high').length;

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="px-4 py-3 border-b border-border bg-destructive/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <EyeOff className="w-4 h-4 text-destructive" />
          <h3 className="font-bold text-foreground text-sm">Zero-Visibility Zones</h3>
          <DemoBadge />
        </div>
        <Badge variant="destructive" className="text-[10px]">
          {criticalCount} HIGH RISK
        </Badge>
      </div>

      <div className="p-4 space-y-3">
        <p className="text-[11px] text-muted-foreground">
          Areas where load-shedding intersects with streetlight faults — creating dangerous dark corridors.
        </p>

        {/* Summary bar */}
        <div className="grid grid-cols-3 gap-2">
          <div className="p-2.5 rounded-lg bg-muted/50 text-center">
            <Zap className="w-4 h-4 mx-auto mb-1 text-safety-yellow" />
            <div className="text-lg font-bold text-foreground">{mockZones.filter(z => z.loadsheddingActive).length}</div>
            <div className="text-[10px] text-muted-foreground">Active Outages</div>
          </div>
          <div className="p-2.5 rounded-lg bg-muted/50 text-center">
            <Lightbulb className="w-4 h-4 mx-auto mb-1 text-safety-orange" />
            <div className="text-lg font-bold text-foreground">{mockZones.reduce((s, z) => s + z.faultyStreetlights, 0)}</div>
            <div className="text-[10px] text-muted-foreground">Faulty Lights</div>
          </div>
          <div className="p-2.5 rounded-lg bg-muted/50 text-center">
            <AlertTriangle className="w-4 h-4 mx-auto mb-1 text-destructive" />
            <div className="text-lg font-bold text-foreground">{criticalCount}</div>
            <div className="text-[10px] text-muted-foreground">Dark Zones</div>
          </div>
        </div>

        {/* Zone List */}
        <div className="space-y-2">
          {mockZones.map(zone => {
            const style = riskStyles[zone.riskLevel];
            const faultPct = Math.round((zone.faultyStreetlights / zone.totalStreetlights) * 100);
            return (
              <div key={zone.area} className={cn(
                "p-3 rounded-lg border transition-all",
                style.bg, style.border,
                zone.riskLevel === 'critical' && "animate-pulse-subtle"
              )}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <MapPin className={cn("w-3.5 h-3.5", style.text)} />
                    <span className="text-sm font-semibold text-foreground">{zone.area}</span>
                    <span className="text-[10px] text-muted-foreground">W{zone.ward}</span>
                  </div>
                  <Badge className={cn("text-[9px] font-bold", style.badge)}>
                    {zone.riskLevel.toUpperCase()}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
                  {zone.loadsheddingActive ? (
                    <span className="flex items-center gap-1 text-safety-yellow">
                      <Zap className="w-3 h-3" />
                      Stage {zone.stage} · Restore {zone.nextRestore}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-safety-green">
                      <Eye className="w-3 h-3" />
                      Power On
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Lightbulb className="w-3 h-3" />
                    {zone.faultyStreetlights}/{zone.totalStreetlights} lights out ({faultPct}%)
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});

ZeroVisibilityZones.displayName = 'ZeroVisibilityZones';
export default ZeroVisibilityZones;
