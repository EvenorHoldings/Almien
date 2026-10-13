// Single source of truth for dashboard view ids and their URLs.
export const VIEW_IDS = [
  'dashboard',
  'map-full',
  'safety-overview',
  'areas',
  'time-analytics',
  'activities',
  'rideshare',
  'trails',
  'emergency',
  'pro-tools',
  'community',
  'alerts',
  'traffic',
  'utilities',
  'airport',
  'government',
  'predictive',
  'biodiversity',
  'accessibility',
  'night-economy',
  'pred-maintenance',
  'traffic-optimizer',
  'exposure-tracker',
  'permit-reviewer',
  'microclimate',
  'carbon-dashboard',
  'utility-insights',
  'volunteer-match',
  'municipal-scorecard',
  'tourism-hub',
  'resilience',
  'api-hub',
  'sa-crime-layer',
  'safety-network',
  'safe-route',
  'safe-space',
  'darkness-windows',
  'vehicle-crime',
  'school-safety',
  'business-safety',
  'neural-profile',
  'dark-zones',
  'safi-history',
  'profile',
  'settings',
] as const;

export type ViewId = (typeof VIEW_IDS)[number];

/** Views that have a short top-level URL. All other views live at /view/:id. */
export const VIEW_SHORT_PATHS: Partial<Record<ViewId, string>> = {
  'dashboard': '/dashboard',
  'map-full': '/map',
  'safe-route': '/routes',
  'community': '/network',
  'profile': '/me',
};

/** Legacy ids that render the dashboard instead of their own view. */
export const ALIAS_VIEWS: ViewId[] = ['areas', 'time-analytics'];

export const isViewId = (v: string | undefined): v is ViewId =>
  !!v && (VIEW_IDS as readonly string[]).includes(v);

export const viewPath = (view: ViewId): string => VIEW_SHORT_PATHS[view] ?? `/view/${view}`;
