import { useState, useCallback, lazy, Suspense, memo } from 'react';
import { 
  AlertTriangle, Grid3X3, Camera, Flame, Shield,
  Bike, Mountain, MapPin, TrafficCone, Users, Menu,
  PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen,
  Bell, Activity
} from 'lucide-react';
import TopStatusBar from './TopStatusBar';
import MapFirstView from './MapFirstView';
import ControlHub, { LayerConfig } from './ControlHub';
import ContextDrawer from './ContextDrawer';
import AlertsFeed from './AlertsFeed';
import ModuleTabBar from './ModuleTabBar';
import { useDashboard } from '@/contexts/DashboardContext';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import MiniMap from '@/components/map/MiniMap';
import LiveModeToggle from '@/components/map/LiveModeToggle';
import MapFilterBar from '@/components/map/MapFilterBar';
import TimeSlider from '@/components/map/TimeSlider';
import DrawingToolbar from '@/components/map/DrawingToolbar';
import EntityDetailPanel from '@/components/map/EntityDetailPanel';

// Lazy-load non-critical panels
const IntelligenceSidebar = lazy(() => import('./IntelligenceSidebar'));
const MobileBottomSheet = lazy(() => import('./MobileBottomSheet'));
const AreaIntelligenceDrawer = lazy(() => import('./AreaIntelligenceDrawer'));

/**
 * Map-First Layout — v2.0 Smart Hybrid Model
 * 
 * Three-zone layout with persistent sidebars:
 * ┌──────────────────────────────────────────────────┐
 * │ TOP STATUS BAR (h-12, z-50)                      │
 * ├──────────┬────────────────────────┬───────────────┤
 * │ LEFT     │                        │ RIGHT         │
 * │ 30%      │  CENTER MAP + MODULES  │ 20%           │
 * │ Nav/Ctrl │  50% (flex)            │ Contextual    │
 * │ Filters  │  + Bottom Tab Bar      │ Alerts Feed   │
 * │ Search   │                        │ or Details    │
 * ├──────────┴────────────────────────┴───────────────┤
 * │ SOS DOCK (z-50, fixed bottom)                     │
 * └──────────────────────────────────────────────────┘
 *
 * Principles:
 * 1. Map always visible — anchor for spatial context
 * 2. 3-tier info: always-visible → on-demand → deep-dive
 * 3. Everything accessible within 2 clicks
 * 4. Right panel: alerts feed by default, entity details on selection
 * 5. Bottom tab bar: Crime, Areas, Routes, Trails modules
 */

type TimeRange = '1h' | '6h' | '24h' | '7d' | '30d';
type SeverityLevel = 'all' | 'low' | 'medium' | 'high' | 'critical';

const MapFirstLayout = () => {
  const { isTravelerMode, setTravelerMode, selectedEntity, clearSelection } = useDashboard();
  const isMobile = useIsMobile();

  // Sidebar collapse state
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');
  const [severity, setSeverity] = useState<SeverityLevel>('all');
  
  // Layer configuration
  const [layers, setLayers] = useState<LayerConfig[]>([
    { id: 'heatmap', name: 'Crime Heatmap', icon: AlertTriangle, color: '#ef4444', enabled: true, category: 'safety' },
    { id: 'safezones', name: 'Safe Zones', icon: Shield, color: '#10b981', enabled: true, category: 'safety' },
    { id: 'reports', name: 'Citizen Reports', icon: Users, color: '#f97316', enabled: true, category: 'safety' },
    { id: 'risk', name: 'Pickpocket Zones', icon: AlertTriangle, color: '#f97316', enabled: false, category: 'safety' },
    { id: 'wards', name: 'Ward Boundaries', icon: Grid3X3, color: '#6366f1', enabled: true, category: 'infrastructure' },
    { id: 'cctv', name: 'CCTV Cameras', icon: Camera, color: '#3b82f6', enabled: false, category: 'infrastructure' },
    { id: 'traffic', name: 'Traffic Signals', icon: TrafficCone, color: '#22c55e', enabled: false, category: 'infrastructure' },
    { id: 'cycling', name: 'Cycle Lanes', icon: Bike, color: '#10b981', enabled: false, category: 'infrastructure' },
    { id: 'hiking', name: 'Hiking Trails', icon: Mountain, color: '#92400e', enabled: false, category: 'infrastructure' },
    { id: 'wildfire', name: 'Wildfire (AFIS)', icon: Flame, color: '#ef4444', enabled: false, category: 'operations', restrictedTo: ['analyst', 'responder'] },
    { id: 'hotspots', name: 'Accident Hotspots', icon: MapPin, color: '#ef4444', enabled: false, category: 'operations', restrictedTo: ['analyst', 'responder'] },
  ]);

  const handleToggleLayer = useCallback((id: string) => {
    setLayers(prev => prev.map(l => 
      l.id === id ? { ...l, enabled: !l.enabled } : l
    ));
  }, []);

  const showLeftSidebar = !isTravelerMode && !isMobile;
  const showRightSidebar = !isTravelerMode && !isMobile;

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      {/* TOP STATUS BAR */}
      <TopStatusBar
        isTravelerMode={isTravelerMode}
        onToggleTravelerMode={() => setTravelerMode(!isTravelerMode)}
        alertCount={3}
        connectionStatus="connected"
      />

      {/* MAIN CONTENT — resizable 3-panel layout (desktop) / stacked (mobile) */}
      <div className="flex-1 overflow-hidden relative">

        {/* MOBILE / TRAVELER: full-bleed map only */}
        {(isMobile || isTravelerMode) && (
          <main className="absolute inset-0 overflow-hidden">
            <MapFirstView fullHeight onMapInteraction={() => {}} />

            {/* Mobile floating control hub */}
            {isMobile && !isTravelerMode && (
              <ControlHub
                layers={layers}
                onToggleLayer={handleToggleLayer}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                timeRange={timeRange}
                onTimeRangeChange={setTimeRange}
                severity={severity}
                onSeverityChange={setSeverity}
                isExpanded={false}
                onToggleExpand={() => {}}
                onCollapseAll={() => {}}
              />
            )}

            {!isTravelerMode && <ModuleTabBar />}
          </main>
        )}

        {/* DESKTOP: resizable 3-panel system */}
        {!isMobile && !isTravelerMode && (
          <ResizablePanelGroup direction="horizontal" className="h-full w-full">

            {/* LEFT — controls / filters / search */}
            {!leftCollapsed && (
              <>
                <ResizablePanel
                  defaultSize={22}
                  minSize={16}
                  maxSize={34}
                  className="bg-card/95 backdrop-blur-xl border-r border-border/30"
                >
                  <div className="relative h-full flex flex-col">
                    <div className="flex items-center justify-between px-2 pt-2 pb-1">
                      <span className="font-mono text-[9px] tracking-[0.25em] text-[#7C3AED]/80">CONTROL_HUB</span>
                      <button
                        onClick={() => setLeftCollapsed(true)}
                        className="p-1 rounded-md bg-muted/50 hover:bg-muted transition-colors"
                        aria-label="Collapse left panel"
                      >
                        <PanelLeftClose className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                    </div>
                    <ScrollArea className="flex-1">
                      <div className="p-3 space-y-3">
                        <MapFilterBar />
                        <ControlHub
                          layers={layers}
                          onToggleLayer={handleToggleLayer}
                          searchQuery={searchQuery}
                          onSearchChange={setSearchQuery}
                          timeRange={timeRange}
                          onTimeRangeChange={setTimeRange}
                          severity={severity}
                          onSeverityChange={setSeverity}
                          isExpanded={true}
                          onToggleExpand={() => {}}
                          onCollapseAll={() => {}}
                          className="relative static w-full"
                        />
                      </div>
                    </ScrollArea>
                  </div>
                </ResizablePanel>
                <ResizableHandle withHandle />
              </>
            )}

            {/* CENTER — map */}
            <ResizablePanel defaultSize={leftCollapsed && rightCollapsed ? 100 : leftCollapsed || rightCollapsed ? 78 : 56} minSize={40}>
              <main className="relative h-full overflow-hidden">
                {/* Collapsed-rail expanders */}
                {leftCollapsed && (
                  <button
                    onClick={() => setLeftCollapsed(false)}
                    aria-label="Expand left panel"
                    className="absolute left-2 top-1/2 -translate-y-1/2 z-[1100] p-2 bg-black/85 border border-[#1A1A1A] hover:border-[#7C3AED]/50 transition-colors"
                  >
                    <PanelLeftOpen className="w-4 h-4 text-[#7C3AED]" />
                  </button>
                )}
                {rightCollapsed && (
                  <button
                    onClick={() => setRightCollapsed(false)}
                    aria-label="Expand right panel"
                    className="absolute right-2 top-1/2 -translate-y-1/2 z-[1100] p-2 bg-black/85 border border-[#1A1A1A] hover:border-[#7C3AED]/50 transition-colors"
                  >
                    <PanelRightOpen className="w-4 h-4 text-[#7C3AED]" />
                  </button>
                )}

                {/* Live mode toggle — top-right cluster */}
                <div className="absolute top-3 right-3 z-[1100]">
                  <LiveModeToggle />
                </div>

                <MapFirstView fullHeight onMapInteraction={() => {}} />

                {/* Drawing toolbar — left edge */}
                <DrawingToolbar />

                {/* Time scrubber — bottom-center */}
                <TimeSlider />

                {/* Mini-map — bottom-right */}
                <MiniMap bottom={64} right={16} />

                <ModuleTabBar />
              </main>
            </ResizablePanel>

            {/* RIGHT — alerts / entity detail */}
            {!rightCollapsed && (
              <>
                <ResizableHandle withHandle />
                <ResizablePanel
                  defaultSize={22}
                  minSize={16}
                  maxSize={34}
                  className="bg-card/95 backdrop-blur-xl border-l border-border/30"
                >
                  <div className="relative h-full flex flex-col">
                    <div className="flex items-center justify-between px-2 pt-2 pb-1">
                      <span className="font-mono text-[9px] tracking-[0.25em] text-[#7C3AED]/80">
                        {selectedEntity && selectedEntity.type !== 'area' ? 'ENTITY_DETAIL' : 'LIVE_FEED'}
                      </span>
                      <button
                        onClick={() => setRightCollapsed(true)}
                        className="p-1 rounded-md bg-muted/50 hover:bg-muted transition-colors"
                        aria-label="Collapse right panel"
                      >
                        <PanelRightClose className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                    </div>
                    <ScrollArea className="flex-1">
                      <div className="p-3">
                        {selectedEntity && selectedEntity.type !== 'area' ? (
                          <EntityDetailPanel />
                        ) : (
                          <AlertsFeed />
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                </ResizablePanel>
              </>
            )}
          </ResizablePanelGroup>
        )}

        {/* MOBILE: Bottom Sheet for intelligence */}
        {isMobile && (
          <Suspense fallback={null}>
            <MobileBottomSheet
              isOpen={false}
              onClose={() => {}}
              title="Safety Intelligence"
              initialState="expanded"
            >
              <div className="p-4">
                <IntelligenceSidebar />
              </div>
            </MobileBottomSheet>
          </Suspense>
        )}

        {/* CONTEXT DRAWER — non-area entities (mobile only) */}
        {selectedEntity && selectedEntity.type !== 'area' && isMobile && (
          <ContextDrawer
            entity={selectedEntity}
            onClose={clearSelection}
          />
        )}

        {/* AREA INTELLIGENCE DRAWER */}
        <Suspense fallback={null}>
          <AreaIntelligenceDrawer
            isOpen={selectedEntity?.type === 'area'}
            onClose={clearSelection}
          />
        </Suspense>
      </div>
    </div>
  );
};

export default memo(MapFirstLayout);
