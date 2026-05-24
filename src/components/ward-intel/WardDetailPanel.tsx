import { memo } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CloudRain, TrafficCone, Info } from 'lucide-react';
import { useWardIntelStore } from '@/stores/wardIntelStore';
import { useWardDetails } from '@/hooks/useWardDetails';
import { cn } from '@/lib/utils';

const bandColor = (band: 'low' | 'elevated' | 'high') =>
  band === 'high' ? 'bg-red-500' : band === 'elevated' ? 'bg-yellow-500' : 'bg-emerald-500';

/**
 * Ward Intelligence Panel — slides in when any ward polygon is clicked.
 * Renders: weather, traffic-signal density, crime stats with anomaly flags, risk gauge, insight.
 */
const WardDetailPanel = memo(function WardDetailPanel() {
  const { openWardId, close } = useWardIntelStore();
  const { data, isLoading, isError } = useWardDetails(openWardId);

  return (
    <Sheet open={openWardId != null} onOpenChange={(o) => !o && close()}>
      <SheetContent side="right" className="w-full sm:max-w-md bg-background overflow-y-auto">
        <SheetHeader className="space-y-1">
          <SheetTitle className="font-mono uppercase tracking-wider text-sm">
            {data?.ward?.name ?? (isLoading ? 'Loading…' : 'Ward Intelligence')}
          </SheetTitle>
          <SheetDescription className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Predictive Safety Intelligence
          </SheetDescription>
        </SheetHeader>

        {isLoading && (
          <div className="mt-6 space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        )}

        {isError && !isLoading && (
          <div className="mt-6 p-4 border border-red-500/40 bg-red-500/5 text-sm">
            Failed to load ward intelligence. Try again.
          </div>
        )}

        {data && !isLoading && (
          <div className="mt-6 space-y-5">
            {/* Risk gauge */}
            <section className="border border-border p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Risk Score</span>
                <Badge variant="outline" className="font-mono uppercase">{data.risk.band}</Badge>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold tabular-nums">{data.risk.score}</span>
                <span className="text-xs text-muted-foreground">/100</span>
              </div>
              <div className="h-2 w-full bg-muted overflow-hidden">
                <div
                  className={cn('h-full transition-all', bandColor(data.risk.band))}
                  style={{ width: `${data.risk.score}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed pt-1">{data.risk.insight}</p>
            </section>

            {/* Weather + traffic lights */}
            <section className="grid grid-cols-2 gap-2">
              <div className="border border-border p-3 space-y-1">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <CloudRain className="h-3 w-3" />
                  <span className="font-mono text-[10px] uppercase tracking-widest">Weather</span>
                </div>
                <div className="text-2xl font-bold tabular-nums">{data.weather.temp}°</div>
                <div className="text-xs capitalize">{data.weather.description ?? '—'}</div>
                {data.weather.wind_kmh != null && (
                  <div className="text-[10px] text-muted-foreground font-mono">Wind {data.weather.wind_kmh} km/h</div>
                )}
                {data.weather.status === 'demo' && (
                  <div className="text-[9px] text-amber-500 font-mono">DEMO</div>
                )}
              </div>
              <div className="border border-border p-3 space-y-1">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <TrafficCone className="h-3 w-3" />
                  <span className="font-mono text-[10px] uppercase tracking-widest">Signals</span>
                </div>
                <div className="text-2xl font-bold tabular-nums">{data.traffic_lights.count}</div>
                <div className="text-xs text-muted-foreground">Traffic lights in ward</div>
                <div className="flex items-center gap-1 text-[9px] text-muted-foreground font-mono">
                  <Info className="h-2.5 w-2.5" />
                  OSM Overpass
                </div>
              </div>
            </section>

            {/* Crime stats */}
            <section className="border border-border">
              <div className="px-3 py-2 border-b border-border font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Crime — last 7 days
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    <th className="text-left p-2 font-mono">Type</th>
                    <th className="text-right p-2 font-mono">Week</th>
                    <th className="text-right p-2 font-mono">4w avg</th>
                    <th className="text-right p-2 font-mono">Δ</th>
                  </tr>
                </thead>
                <tbody>
                  {data.crime.map((c) => (
                    <tr key={c.crime_type} className="border-t border-border">
                      <td className="p-2 capitalize flex items-center gap-1.5">
                        {c.anomaly && <AlertTriangle className="h-3 w-3 text-red-500" />}
                        {c.crime_type}
                      </td>
                      <td className="p-2 text-right tabular-nums">{c.this_week}</td>
                      <td className="p-2 text-right tabular-nums text-muted-foreground">{c.four_week_avg}</td>
                      <td className={cn(
                        'p-2 text-right tabular-nums font-mono text-xs',
                        c.delta_pct > 0 ? 'text-red-500' : c.delta_pct < 0 ? 'text-emerald-500' : 'text-muted-foreground'
                      )}>
                        {c.delta_pct > 0 ? '+' : ''}{c.delta_pct}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            <p className="text-[9px] text-muted-foreground font-mono uppercase tracking-widest">
              Synthetic data · Generated {new Date(data.generated_at).toLocaleTimeString()}
            </p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
});

export default WardDetailPanel;
