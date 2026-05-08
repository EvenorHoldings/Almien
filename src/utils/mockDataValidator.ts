/**
 * Cape Town bounding-box validator for mock crime alerts.
 * Used to keep generated demo data inside realistic geographic bounds.
 */

export const CAPE_TOWN_BOUNDS = {
  lat: { min: -34.3576, max: -33.7246 },
  lng: { min: 18.3213, max: 18.8783 },
};

export interface GeoPoint {
  lat: number;
  lng: number;
}

export const isInCapeTown = (p: GeoPoint): boolean =>
  p.lat >= CAPE_TOWN_BOUNDS.lat.min &&
  p.lat <= CAPE_TOWN_BOUNDS.lat.max &&
  p.lng >= CAPE_TOWN_BOUNDS.lng.min &&
  p.lng <= CAPE_TOWN_BOUNDS.lng.max;

export const validateAlerts = <T extends { location: GeoPoint }>(alerts: T[]): T[] =>
  alerts.filter((a) => isInCapeTown(a.location));

export const SAPS_CRIME_TYPES = [
  'Theft',
  'Assault',
  'Robbery',
  'Hijacking',
  'Burglary',
  'GBV',
] as const;
