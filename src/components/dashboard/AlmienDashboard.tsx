import { useState, useCallback, useEffect, memo, lazy, Suspense } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useIsMobile } from '@/hooks/use-mobile';
import AlmienSidebar from './AlmienSidebar';
import TacticalNav, { type TacticalTab } from './TacticalNav';
import SOSActionDock from './SOSActionDock';
import ThreatHeader from './ThreatHeader';
import TrialBanner from './TrialBanner';
import UpgradeModal from './UpgradeModal';
import OnboardingFlow from '@/components/onboarding/OnboardingFlow';
import ZoneDirectory from './widgets/ZoneDirectory';
import SafiAI from '@/components/safi/SafiAI';

// Eager: shell + the most likely first-paint surfaces.
// CommandCenterHome (mobile /dashboard) and MapFullView (desktop split + /map)
// are mounted on initial render so we ship them in the main chunk.
import CommandCenterHome from './CommandCenterHome';
import MapFullView from './views/MapFullView';

// Lazy: every other view is route/state-gated. Splitting them out trims
// ~14k lines of view code from the initial bundle and lets each view's
// downstream dependencies (charts, heavy data) load only when shown.
const DashboardView          = lazy(() => import('./views/DashboardView'));
const TacticalMapView        = lazy(() => import('./views/TacticalMapView'));
const SafetyOverviewView     = lazy(() => import('./views/SafetyOverviewView'));
const ActivitiesView         = lazy(() => import('./views/ActivitiesView'));
const RideShareView          = lazy(() => import('./views/RideShareView'));
const TrailSafetyView        = lazy(() => import('./views/TrailSafetyView'));
const EmergencyContactsView  = lazy(() => import('./views/EmergencyContactsView'));
const ProfessionalToolsView  = lazy(() => import('./views/ProfessionalToolsView'));
const CommunityIntelView     = lazy(() => import('./views/CommunityIntelView'));
const TrustGridView          = lazy(() => import('./views/TrustGridView'));
const AlertsView             = lazy(() => import('./views/AlertsView'));
const SettingsView           = lazy(() => import('./views/SettingsView'));
const TrafficTransportView   = lazy(() => import('./views/TrafficTransportView'));
const UtilitiesServicesView  = lazy(() => import('./views/UtilitiesServicesView'));
const AirportInfoView        = lazy(() => import('./views/AirportInfoView'));
const GovernmentServicesView = lazy(() => import('./views/GovernmentServicesView'));
const PredictiveAnalyticsView = lazy(() => import('./views/PredictiveAnalyticsView'));
const BiodiversityView       = lazy(() => import('./views/BiodiversityView'));
const AccessibilityView      = lazy(() => import('./views/AccessibilityView'));
const NightEconomyView       = lazy(() => import('./views/NightEconomyView'));
const PredictiveMaintenanceView = lazy(() => import('./views/PredictiveMaintenanceView'));
const TrafficOptimizerView   = lazy(() => import('./views/TrafficOptimizerView'));
const ExposureTrackerView    = lazy(() => import('./views/ExposureTrackerView'));
const PermitReviewerView     = lazy(() => import('./views/PermitReviewerView'));
const MicroclimateView       = lazy(() => import('./views/MicroclimateView'));
const CarbonDashboardView    = lazy(() => import('./views/CarbonDashboardView'));
const UtilityInsightsView    = lazy(() => import('./views/UtilityInsightsView'));
const VolunteerMatchView     = lazy(() => import('./views/VolunteerMatchView'));
const MunicipalScorecardView = lazy(() => import('./views/MunicipalScorecardView'));
const TourismHubView         = lazy(() => import('./views/TourismHubView'));
const ResilienceView         = lazy(() => import('./views/ResilienceView'));
const ApiHubView             = lazy(() => import('./views/ApiHubView'));
const SACrimeLayerView       = lazy(() => import('./views/SACrimeLayerView'));
const SafetyNetworkView      = lazy(() => import('./views/SafetyNetworkView'));
const SafeRouteView          = lazy(() => import('./views/SafeRouteView'));
const CorridorIntelView      = lazy(() => import('./views/CorridorIntelView'));
const SafeSpaceView          = lazy(() => import('./views/SafeSpaceView'));
const DarknessWindowView     = lazy(() => import('./views/DarknessWindowView'));
const VehicleCrimeView       = lazy(() => import('./views/VehicleCrimeView'));
const SchoolSafetyView       = lazy(() => import('./views/SchoolSafetyView'));
const BusinessSafetyView     = lazy(() => import('./views/BusinessSafetyView'));
const NeuralProfileView      = lazy(() => import('./views/NeuralProfileView'));
const DarkZoneView           = lazy(() => import('./views/DarkZoneView'));
const SafiConversationsView  = lazy(() => import('./views/SafiConversationsView'));
const ProfileView            = lazy(() => import('./views/ProfileView'));
const NeuralMeView           = lazy(() => import('./views/NeuralMeView'));

import { RegionProvider } from '@/contexts/RegionContext';
import { SAPSCrimeProvider } from '@/contexts/SAPSCrimeContext';
import { useDashboard } from '@/contexts/DashboardContext';
import PanicButton from './PanicButton';
import WitnessReportButton from './WitnessReportButton';
import CommandPill from './CommandPill';
import TravelerModeView from './TravelerModeView';

// Tactical loading placeholder — keeps panel height stable so Suspense
// transitions don't cause layout reflow when a view's chunk arrives.
const ViewFallback = () => (
  <div className="w-full min-h-[60vh] flex items-center justify-center">
    <div className="font-mono text-[10px] tracking-[0.2em] text-[#555] animate-pulse">
      LOADING_MODULE…
    </div>
  </div>
);

export type { ViewId } from './viewIds';
import { viewPath } from './viewIds';
import type { ViewId } from './viewIds';

interface AlmienDashboardProps {
  initialView?: ViewId;
}

// Map between URL routes and ViewIds for the 5 top-level destinations
const TAB_TO_VIEW: Record<TacticalTab, ViewId> = {
  home:    'dashboard',
  map:     'map-full',
  routes:  'safe-route',
  network: 'community',
  me:      'profile',
};
const VIEW_TO_TAB: Partial<Record<ViewId, TacticalTab>> = {
  'dashboard':  'home',
  'map-full':   'map',
  'safe-route': 'routes',
  'community':  'network',
  'profile':    'me',
};
const TAB_TO_PATH: Record<TacticalTab, string> = {
  home: '/dashboard', map: '/map', routes: '/routes', network: '/network', me: '/me',
};

const AlmienDashboard = memo(({ initialView = 'dashboard' }: AlmienDashboardProps) => {
  const isMobile = useIsMobile();
  const { isTravelerMode, setTravelerMode } = useDashboard();
  const location = useLocation();
  const routerNavigate = useNavigate();
  const [activeView, setActiveView] = useState<ViewId>(initialView);
  const [upgradeModal, setUpgradeModal] = useState<{ open: boolean; trigger?: string }>({ open: false });
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [showZoneDirectory, setShowZoneDirectory] = useState(false);
  const [safiOpen, setSafiOpen] = useState(false);
  const [safiMode, setSafiMode] = useState<'chat' | 'briefing' | 'route' | 'emergency'>('chat');
  const [showOnboarding, setShowOnboarding] = useState(() => {
    return !localStorage.getItem('almien-onboarded');
  });

  const isSafeSpaceView = activeView === 'safe-space';

  // Sync activeView when the URL changes (e.g. user hits back/forward).
  useEffect(() => {
    if (initialView && initialView !== activeView) setActiveView(initialView);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialView]);

  useEffect(() => {
    if (isMobile && sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isMobile, sidebarOpen]);

  const openUpgrade = useCallback((trigger?: string) => {
    setUpgradeModal({ open: true, trigger });
  }, []);

  const navigate = useCallback((view: ViewId) => {
    if (view === 'areas' || view === 'time-analytics') {
      setActiveView('dashboard');
    } else {
      setActiveView(view);
    }
    // Mirror every view to its own URL so it can be bookmarked / shared
    const path = viewPath(view === 'areas' || view === 'time-analytics' ? 'dashboard' : view);
    if (location.pathname !== path) {
      routerNavigate(path);
    }
    if (isMobile) setSidebarOpen(false);
  }, [isMobile, location.pathname, routerNavigate]);

  const handleTabNavigate = useCallback((tab: TacticalTab) => {
    const view = TAB_TO_VIEW[tab];
    setActiveView(view);
    if (location.pathname !== TAB_TO_PATH[tab]) {
      routerNavigate(TAB_TO_PATH[tab]);
    }
  }, [location.pathname, routerNavigate]);

  const handleSos = useCallback(() => {
    // SOS hold completed — surface emergency Safi mode
    setSafiMode('emergency');
    setSafiOpen(true);
  }, []);

  const handleOnboardingComplete = useCallback(() => {
    localStorage.setItem('almien-onboarded', 'true');
    setShowOnboarding(false);
  }, []);

  const openSafi = useCallback((mode: 'chat' | 'briefing' | 'route' | 'emergency' = 'chat') => {
    setSafiMode(mode);
    setSafiOpen(true);
  }, []);

  const renderView = () => {
    const props = { onUpgrade: openUpgrade, onNavigate: navigate };
    switch (activeView) {
      case 'dashboard':
        // Mobile gets the new Obsidian Tactical Command Center.
        // Desktop keeps the bento DashboardView (used inside the right panel).
        return isMobile
          ? <CommandCenterHome onNavigate={navigate} onOpenSafi={openSafi} onUpgrade={openUpgrade} />
          : <DashboardView {...props} onOpenSafi={openSafi} />;
      case 'map-full':
        // Mobile gets the new Obsidian Tactical full-bleed radar view.
        // Desktop keeps the rich MapFullView (used in split-screen and full-map mode).
        return isMobile
          ? <TacticalMapView {...props} />
          : <MapFullView {...props} />;
      case 'safety-overview': return <SafetyOverviewView {...props} />;
      case 'activities': return <ActivitiesView {...props} />;
      case 'rideshare': return <RideShareView {...props} />;
      case 'trails': return <TrailSafetyView {...props} />;
      case 'emergency': return <EmergencyContactsView {...props} />;
      case 'pro-tools': return <ProfessionalToolsView {...props} />;
      case 'community':
        // Mobile gets the new Trust Grid (Obsidian Tactical).
        // Desktop keeps the rich CommunityIntelView.
        return isMobile
          ? <TrustGridView {...props} />
          : <CommunityIntelView {...props} />;
      case 'alerts': return <AlertsView {...props} />;
      case 'traffic': return <TrafficTransportView {...props} />;
      case 'utilities': return <UtilitiesServicesView {...props} />;
      case 'airport': return <AirportInfoView {...props} />;
      case 'government': return <GovernmentServicesView {...props} />;
      case 'predictive': return <PredictiveAnalyticsView {...props} />;
      case 'biodiversity': return <BiodiversityView {...props} />;
      case 'accessibility': return <AccessibilityView {...props} />;
      case 'night-economy': return <NightEconomyView {...props} />;
      case 'pred-maintenance': return <PredictiveMaintenanceView />;
      case 'traffic-optimizer': return <TrafficOptimizerView />;
      case 'exposure-tracker': return <ExposureTrackerView />;
      case 'permit-reviewer': return <PermitReviewerView />;
      case 'microclimate': return <MicroclimateView />;
      case 'carbon-dashboard': return <CarbonDashboardView />;
      case 'utility-insights': return <UtilityInsightsView />;
      case 'volunteer-match': return <VolunteerMatchView />;
      case 'municipal-scorecard': return <MunicipalScorecardView />;
      case 'tourism-hub': return <TourismHubView />;
      case 'resilience': return <ResilienceView />;
      case 'api-hub': return <ApiHubView />;
      case 'sa-crime-layer': return <SACrimeLayerView />;
      case 'safety-network': return <SafetyNetworkView {...props} />;
      case 'safe-route':
        // Mobile gets the new Corridor Intelligence (Obsidian Tactical).
        // Desktop keeps the rich SafeRouteView with maps + travel modes.
        return isMobile
          ? <CorridorIntelView {...props} />
          : <SafeRouteView {...props} />;
      case 'safe-space': return <SafeSpaceView {...props} />;
      case 'darkness-windows': return <DarknessWindowView {...props} />;
      case 'vehicle-crime': return <VehicleCrimeView {...props} />;
      case 'school-safety': return <SchoolSafetyView {...props} />;
      case 'business-safety': return <BusinessSafetyView {...props} />;
      case 'neural-profile': return <NeuralProfileView {...props} />;
      case 'dark-zones': return <DarkZoneView {...props} />;
      case 'safi-history': return <SafiConversationsView {...props} onOpenSafi={() => openSafi('chat')} />;
      case 'profile':
        // Mobile gets the new Neural Profile (Obsidian Tactical).
        // Desktop keeps the rich ProfileView.
        return isMobile
          ? <NeuralMeView {...props} />
          : <ProfileView {...props} />;
      case 'settings': return <SettingsView {...props} />;
      default: return <DashboardView {...props} onOpenSafi={openSafi} />;
    }
  };

  if (showOnboarding) {
    return <OnboardingFlow onComplete={handleOnboardingComplete} />;
  }

  return (
    <RegionProvider>
    <SAPSCrimeProvider>
      <div className={cn(
        "h-dvh h-screen flex flex-col sm:flex-row w-full max-w-full overflow-x-hidden overflow-y-hidden bg-background",
        isSafeSpaceView && "safe-space-theme"
      )}>
        {/* Mobile overlay */}
        {isMobile && sidebarOpen && (
          <div className="fixed inset-0 z-[85] bg-black/40" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Sidebar — desktop only */}
        {!isMobile && (
          <AlmienSidebar
            activeView={activeView}
            onNavigate={navigate}
            onUpgrade={() => openUpgrade()}
            isOpen={sidebarOpen}
            onToggle={() => setSidebarOpen(!sidebarOpen)}
            isMobile={false}
          />
        )}

        {/* Mobile sidebar drawer */}
        {isMobile && sidebarOpen && (
          <AlmienSidebar
            activeView={activeView}
            onNavigate={navigate}
            onUpgrade={() => openUpgrade()}
            isOpen={sidebarOpen}
            onToggle={() => setSidebarOpen(!sidebarOpen)}
            isMobile={true}
          />
        )}

        {/* Center workspace
            v5.1 desktop split: map dominates left (60%), active view docks right (40%).
            When the user explicitly opens the map ('map-full' view) we collapse the
            split so coordinators get the full surface area for pure-map work.
            Mobile keeps the single-column linear scroll. */}
        <main className="flex-1 min-w-0 overflow-hidden flex flex-col w-full max-w-full">
          <TrialBanner onUpgrade={() => openUpgrade('See your Almien plan options')} />
          <ThreatHeader
            onBrowseAllAreas={() => setShowZoneDirectory(true)}
            onMenuOpen={isMobile ? () => setSidebarOpen(true) : undefined}
            onSafiEmergency={() => openSafi('emergency')}
            isTravelerMode={isTravelerMode}
            onToggleTravelerMode={() => setTravelerMode(!isTravelerMode)}
          />

          {isTravelerMode ? (
            <ScrollArea className="flex-1">
              <TravelerModeView />
            </ScrollArea>
          ) : !isMobile && activeView !== 'map-full' ? (
            /* Desktop two-column split */
            <div className="flex-1 min-h-0 flex">
              <div className="w-[60%] min-w-0 border-r border-border-subtle relative overflow-hidden">
                <MapFullView onUpgrade={openUpgrade} onNavigate={navigate} />
              </div>
              <ScrollArea className="w-[40%] min-w-0">
                <div className="px-6 py-6 max-w-full content-panel">
                  <Suspense fallback={<ViewFallback />}>{renderView()}</Suspense>
                </div>
              </ScrollArea>
            </div>
          ) : (
            /* Mobile linear scroll · or desktop full-map mode */
            <ScrollArea className="flex-1">
              <div className={cn(
                "mx-auto w-full max-w-full content-panel",
                isMobile ? "max-w-full" : "px-8 py-8 max-w-[720px]"
              )}>
                <Suspense fallback={<ViewFallback />}>{renderView()}</Suspense>
              </div>
            </ScrollArea>
          )}
        </main>

        {/* Floating elements — desktop only.
            On mobile the TacticalNav owns the SOS action and witness
            reporting lives inside the Map page header. */}
        {!isMobile && <PanicButton />}
        {!isMobile && <WitnessReportButton />}
        {!isMobile && <SOSActionDock />}

        {/* Safi AI Panel */}
        <SafiAI isOpen={safiOpen} onClose={() => setSafiOpen(false)} onNavigate={navigate} initialMode={safiMode} />

        {/* Mobile bottom navigation — Obsidian Tactical 5-tab + fixed SOS */}
        {isMobile && (
          <TacticalNav
            active={(VIEW_TO_TAB[activeView] ?? 'home') as TacticalTab}
            onNavigate={handleTabNavigate}
            onSos={handleSos}
          />
        )}

        <UpgradeModal
          isOpen={upgradeModal.open}
          onClose={() => setUpgradeModal({ open: false })}
          trigger={upgradeModal.trigger}
        />

        {showZoneDirectory && (
          <ZoneDirectory onClose={() => setShowZoneDirectory(false)} />
        )}
      </div>
    </SAPSCrimeProvider>
    </RegionProvider>
  );
});

AlmienDashboard.displayName = 'AlmienDashboard';
export default AlmienDashboard;
