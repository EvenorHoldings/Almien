import { useEffect, useState, useMemo } from 'react';
import { 
  BarChart3, TrendingUp, Users, MapPin, Camera, 
  TrafficCone, AlertTriangle, ArrowUpDown, Check,
  Download, Filter, ChevronDown, X, Eye, Maximize2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { wardData, WardData } from '@/data/mapData';
import { useDashboard } from '@/contexts/DashboardContext';

type SortKey = 'name' | 'population' | 'cctvCount' | 'safetyScore' | 'cctvPerKm' | 'cctvPerPop';
type SortDir = 'asc' | 'desc';

// Comparison color palette matching WardBoundariesLayer
const COMPARISON_COLORS = [
  { bg: 'bg-blue-500', text: 'text-blue-400', border: 'border-blue-500/50' },
  { bg: 'bg-emerald-500', text: 'text-emerald-400', border: 'border-emerald-500/50' },
  { bg: 'bg-amber-500', text: 'text-amber-400', border: 'border-amber-500/50' },
  { bg: 'bg-violet-500', text: 'text-violet-400', border: 'border-violet-500/50' },
  { bg: 'bg-red-500', text: 'text-red-400', border: 'border-red-500/50' },
  { bg: 'bg-pink-500', text: 'text-pink-400', border: 'border-pink-500/50' },
];

interface ComparisonViewProps {
  onHighlightedWardsChange?: (wardNumbers: Set<number>) => void;
  onHoveredWardChange?: (wardId: string | null) => void;
}

// Extract ward number from ward ID (e.g., 'w54' -> 54)
const getWardNumber = (wardId: string): number => {
  const match = wardId.match(/\d+/);
  return match ? parseInt(match[0], 10) : 0;
};

const ComparisonView = ({ onHighlightedWardsChange, onHoveredWardChange }: ComparisonViewProps) => {
  const { setComparisonWardNumbers } = useDashboard();
  const [selectedWards, setSelectedWards] = useState<string[]>([wardData[0].id, wardData[1].id]);
  const [sortKey, setSortKey] = useState<SortKey>('safetyScore');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [filterType, setFilterType] = useState<'all' | 'urban' | 'peri-urban'>('all');
  const [hoveredWardId, setHoveredWardId] = useState<string | null>(null);

  // Compute highlighted ward numbers for map
  const highlightedWardNumbers = useMemo(() => {
    const numbers = new Set<number>();
    selectedWards.forEach(wardId => {
      numbers.add(getWardNumber(wardId));
    });
    if (hoveredWardId) {
      numbers.add(getWardNumber(hoveredWardId));
    }
    return numbers;
  }, [selectedWards, hoveredWardId]);

  // Sync highlights to map (and keep optional parent callbacks working)
  useEffect(() => {
    const wardNumbersArray = Array.from(highlightedWardNumbers).sort((a, b) => a - b);
    setComparisonWardNumbers(wardNumbersArray);
    onHighlightedWardsChange?.(highlightedWardNumbers);
  }, [highlightedWardNumbers, onHighlightedWardsChange, setComparisonWardNumbers]);

  // Get color for ward based on selection order
  const getWardColor = (wardId: string) => {
    const index = selectedWards.indexOf(wardId);
    return index >= 0 ? COMPARISON_COLORS[index % COMPARISON_COLORS.length] : null;
  };

  const toggleWard = (id: string) => {
    if (selectedWards.includes(id)) {
      if (selectedWards.length > 1) {
        setSelectedWards(prev => prev.filter(w => w !== id));
      }
    } else {
      setSelectedWards(prev => [...prev, id]);
    }
  };

  const getSortedWards = () => {
    const filtered = filterType === 'all' 
      ? wardData 
      : wardData.filter(w => w.type === filterType);
    
    return [...filtered].sort((a, b) => {
      let valA: number, valB: number;
      
      switch(sortKey) {
        case 'name':
          return sortDir === 'asc' 
            ? a.name.localeCompare(b.name) 
            : b.name.localeCompare(a.name);
        case 'population':
          valA = a.population;
          valB = b.population;
          break;
        case 'cctvCount':
          valA = a.cctvCount;
          valB = b.cctvCount;
          break;
        case 'safetyScore':
          valA = a.safetyScore;
          valB = b.safetyScore;
          break;
        case 'cctvPerKm':
          valA = a.cctvCount / a.areaKm2;
          valB = b.cctvCount / b.areaKm2;
          break;
        case 'cctvPerPop':
          valA = (a.cctvCount / a.population) * 10000;
          valB = (b.cctvCount / b.population) * 10000;
          break;
        default:
          valA = a.safetyScore;
          valB = b.safetyScore;
      }
      
      return sortDir === 'asc' ? valA - valB : valB - valA;
    });
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const selectedData = wardData.filter(w => selectedWards.includes(w.id));
  const sortedWards = getSortedWards();

  // Calculate averages for selected wards
  const avgSafetyScore = selectedData.length > 0 
    ? Math.round(selectedData.reduce((acc, w) => acc + w.safetyScore, 0) / selectedData.length) 
    : 0;
  const avgCctvPerKm = selectedData.length > 0 
    ? (selectedData.reduce((acc, w) => acc + (w.cctvCount / w.areaKm2), 0) / selectedData.length).toFixed(1) 
    : '0';
  const totalPopulation = selectedData.reduce((acc, w) => acc + w.population, 0);
  const totalCctv = selectedData.reduce((acc, w) => acc + w.cctvCount, 0);

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      {/* Header with Summary Stats */}
      <div className="bg-gradient-to-r from-primary/20 to-primary/10 px-4 py-3 border-b border-border">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-foreground">Ward Comparison</h3>
            <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full">
              {selectedWards.length} selected
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <Users className="w-3 h-3 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">
                Pop: <span className="text-foreground font-bold">{totalPopulation.toLocaleString()}</span>
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Camera className="w-3 h-3 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">
                CCTV: <span className="text-foreground font-bold">{totalCctv}</span>
              </span>
            </div>
            <span className="text-muted-foreground/30">|</span>
            <span className="text-[10px] text-muted-foreground">
              Avg Safety: <span className={cn(
                'font-bold',
                avgSafetyScore >= 70 ? 'text-safety-good' :
                avgSafetyScore >= 50 ? 'text-safety-moderate' :
                avgSafetyScore >= 30 ? 'text-safety-poor' : 'text-safety-critical'
              )}>{avgSafetyScore}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Selected Wards Pills - with color indicators */}
      {selectedData.length > 0 && (
        <div className="px-3 py-2 border-b border-border/50 flex items-center gap-2 overflow-x-auto scrollbar-visible">
          <span className="text-[10px] text-muted-foreground whitespace-nowrap">Comparing:</span>
          {selectedData.map(ward => {
            const colors = getWardColor(ward.id);
            return (
              <div 
                key={ward.id}
                className={cn(
                  "flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium border transition-all",
                  colors?.border || 'border-primary/50'
                )}
                onMouseEnter={() => {
                  setHoveredWardId(ward.id);
                  onHoveredWardChange?.(ward.id);
                }}
                onMouseLeave={() => {
                  setHoveredWardId(null);
                  onHoveredWardChange?.(null);
                }}
              >
                <div className={cn("w-2 h-2 rounded-full", colors?.bg || 'bg-primary')} />
                <span className="text-foreground">{ward.name}</span>
                {selectedWards.length > 1 && (
                  <button
                    onClick={() => toggleWard(ward.id)}
                    className="ml-0.5 hover:text-destructive transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Filter Bar */}
      <div className="p-3 border-b border-border/50 flex items-center gap-2 overflow-x-auto scrollbar-visible">
        {(['all', 'urban', 'peri-urban'] as const).map(type => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap',
              filterType === type
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
            )}
          >
            {type === 'all' ? 'All Areas' : type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
        <div className="flex-1" />
        <button className="flex items-center gap-1 px-3 py-1.5 bg-secondary/50 rounded-lg text-xs text-muted-foreground hover:bg-secondary transition-colors">
          <Download className="w-3 h-3" />
          Export
        </button>
      </div>

      {/* Comparison Cards with Color Indicators */}
      {selectedData.length >= 2 && (
        <div className="p-3 border-b border-border/50">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {selectedData.slice(0, 4).map(ward => {
              const colors = getWardColor(ward.id);
              return (
                <div 
                  key={ward.id} 
                  className={cn(
                    "bg-background/50 rounded-lg p-3 border-2 transition-all hover:shadow-md cursor-pointer",
                    colors?.border || 'border-border/50'
                  )}
                  onMouseEnter={() => {
                    setHoveredWardId(ward.id);
                    onHoveredWardChange?.(ward.id);
                  }}
                  onMouseLeave={() => {
                    setHoveredWardId(null);
                    onHoveredWardChange?.(null);
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={cn("w-3 h-3 rounded-full", colors?.bg || 'bg-primary')} />
                      <span className="font-bold text-sm text-foreground">{ward.name}</span>
                    </div>
                    <span className={cn(
                      'px-2 py-0.5 rounded-full text-[10px]',
                      ward.type === 'urban' ? 'bg-primary/20 text-primary' : 'bg-secondary text-muted-foreground'
                    )}>
                      {ward.type}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Safety Score</span>
                      <span className={cn(
                        'font-bold',
                        ward.safetyScore >= 70 ? 'text-safety-good' :
                        ward.safetyScore >= 50 ? 'text-safety-moderate' :
                        ward.safetyScore >= 30 ? 'text-safety-poor' : 'text-safety-critical'
                      )}>{ward.safetyScore}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">CCTV/km²</span>
                      <span className="font-mono text-foreground">{(ward.cctvCount / ward.areaKm2).toFixed(1)}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Population</span>
                      <span className="font-mono text-foreground">{ward.population.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Hotspots</span>
                      <span className={cn(
                        'font-mono',
                        ward.accidentHotspots > 5 ? 'text-safety-critical' : 'text-foreground'
                      )}>{ward.accidentHotspots}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Table View */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-background/50 border-b border-border">
              <th className="text-left p-2 font-medium text-muted-foreground">Select</th>
              <th 
                className="text-left p-2 font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center gap-1">
                  Ward
                  {sortKey === 'name' && <ArrowUpDown className="w-3 h-3" />}
                </div>
              </th>
              <th className="text-left p-2 font-medium text-muted-foreground">Type</th>
              <th 
                className="text-right p-2 font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                onClick={() => handleSort('population')}
              >
                <div className="flex items-center justify-end gap-1">
                  Population
                  {sortKey === 'population' && <ArrowUpDown className="w-3 h-3" />}
                </div>
              </th>
              <th 
                className="text-right p-2 font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                onClick={() => handleSort('cctvPerKm')}
              >
                <div className="flex items-center justify-end gap-1">
                  CCTV/km²
                  {sortKey === 'cctvPerKm' && <ArrowUpDown className="w-3 h-3" />}
                </div>
              </th>
              <th 
                className="text-right p-2 font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                onClick={() => handleSort('safetyScore')}
              >
                <div className="flex items-center justify-end gap-1">
                  Safety
                  {sortKey === 'safetyScore' && <ArrowUpDown className="w-3 h-3" />}
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedWards.map(ward => (
              <tr 
                key={ward.id}
                className={cn(
                  'border-b border-border/30 hover:bg-background/50 transition-colors',
                  selectedWards.includes(ward.id) && 'bg-primary/5'
                )}
              >
                <td className="p-2">
                  <button
                    onClick={() => toggleWard(ward.id)}
                    className={cn(
                      'w-5 h-5 rounded border flex items-center justify-center transition-colors',
                      selectedWards.includes(ward.id)
                        ? 'bg-primary border-primary text-primary-foreground'
                        : 'border-border hover:border-primary'
                    )}
                  >
                    {selectedWards.includes(ward.id) && <Check className="w-3 h-3" />}
                  </button>
                </td>
                <td className="p-2 font-medium text-foreground">
                  <div className="flex items-center gap-2">
                    {selectedWards.includes(ward.id) && (
                      <div className={cn("w-2 h-2 rounded-full", getWardColor(ward.id)?.bg || 'bg-primary')} />
                    )}
                    {ward.name}
                  </div>
                </td>
                <td className="p-2">
                  <span className={cn(
                    'px-1.5 py-0.5 rounded text-[10px]',
                    ward.type === 'urban' ? 'bg-primary/20 text-primary' : 'bg-secondary text-muted-foreground'
                  )}>
                    {ward.type}
                  </span>
                </td>
                <td className="p-2 text-right font-mono text-muted-foreground">
                  {ward.population.toLocaleString()}
                </td>
                <td className="p-2 text-right font-mono text-foreground">
                  {(ward.cctvCount / ward.areaKm2).toFixed(1)}
                </td>
                <td className="p-2 text-right">
                  <span className={cn(
                    'font-bold',
                    ward.safetyScore >= 70 ? 'text-safety-good' :
                    ward.safetyScore >= 50 ? 'text-safety-moderate' :
                    ward.safetyScore >= 30 ? 'text-safety-poor' : 'text-safety-critical'
                  )}>
                    {ward.safetyScore}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="px-4 py-2 bg-background/30 border-t border-border flex items-center justify-between text-[10px] font-mono text-muted-foreground">
        <span>{selectedWards.length} ward{selectedWards.length !== 1 ? 's' : ''} selected</span>
        <span>Last updated: {wardData[0].lastUpdate}</span>
      </div>
    </div>
  );
};

export default ComparisonView;
