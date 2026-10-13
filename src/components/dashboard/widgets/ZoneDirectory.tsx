import { memo, useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Search, X, Bookmark, ArrowLeft, ArrowUpDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { capeTownAreas, searchAreas, type AreaSafetyData } from '@/data/capeTownSafetyData';

type SortMode = 'risk' | 'alpha';

const riskPill: Record<string, { label: string; cls: string }> = {
  green: { label: 'LOW', cls: 'bg-safety-green/15 text-safety-green' },
  yellow: { label: 'MODERATE', cls: 'bg-safety-yellow/15 text-safety-yellow' },
  orange: { label: 'HIGH', cls: 'bg-safety-orange/15 text-safety-orange' },
  red: { label: 'CRITICAL', cls: 'bg-safety-red/15 text-safety-red' },
};

const crimeIcons: Record<string, string> = {
  Theft: '🔵', Robbery: '🔴', Assault: '🟡', GBV: '🟣',
  Drugs: '⚪', Hijacking: '🔴', Housebreaking: '🟠', default: '⚫',
};

interface Props {
  onClose: () => void;
  onSaveZone?: (area: AreaSafetyData) => void;
}

const ZoneDirectory = memo(({ onClose, onSaveZone }: Props) => {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortMode>('risk');

  const areas = useMemo(() => {
    const list = query.trim() ? searchAreas(query) : [...capeTownAreas];
    if (sort === 'risk') {
      list.sort((a, b) => a.safetyScore - b.safetyScore); // highest risk first (lowest score)
    } else {
      list.sort((a, b) => a.name.localeCompare(b.name));
    }
    return list;
  }, [query, sort]);

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col animate-fade-in">
      {/* Header */}
      <div className="shrink-0 px-4 py-3 border-b border-border flex items-center gap-3">
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h2 className="text-sm font-bold text-foreground flex-1">Browse All Areas</h2>
        <button
          onClick={() => setSort(s => s === 'risk' ? 'alpha' : 'risk')}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-secondary text-[10px] font-semibold text-muted-foreground"
        >
          <ArrowUpDown className="w-3 h-3" />
          {sort === 'risk' ? 'By Risk' : 'A–Z'}
        </button>
      </div>

      {/* Search */}
      <div className="shrink-0 px-4 py-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Search suburb, street, or precinct..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
          {query && (
            <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto px-4 pb-8">
        <div className="space-y-1.5">
          {areas.map(area => {
            const pill = riskPill[area.safetyLevel];
            // Determine the dominant crime type from the first recommended activity or fallback
            const topCrime = area.recommendedActivities.length > 0 ? area.safetyTips[0]?.split(' ')[0] || 'Theft' : 'Theft';
            return (
              <div key={area.id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-foreground truncate">{area.name}</p>
                    <span className={cn("px-1.5 py-0.5 rounded-full text-[8px] font-bold uppercase shrink-0", pill.cls)}>
                      {pill.label}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {area.incidentCount.last7Days} incidents / 7d · Score {area.safetyScore}/10
                  </p>
                </div>
                <button
                  onClick={() => onSaveZone?.(area)}
                  className="p-2 rounded-lg hover:bg-secondary shrink-0"
                  title="Save zone"
                >
                  <Bookmark className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            );
          })}
          {areas.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">No areas found</p>
          )}
        </div>
      </div>
    </div>
  );
});

ZoneDirectory.displayName = 'ZoneDirectory';
export default ZoneDirectory;
