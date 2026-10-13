-- RLS hardening (audit 2026-10-13). NOT applied to production by this PR.
-- Review, then apply with `supabase db push` / Lovable when ready.
--
-- Audit result: every table already has RLS enabled, and the sensitive tables
-- (profiles, user_roles, incidents, responder_units, unit_members,
-- unit_status_events, incident_assignments) already refuse anon entirely.
-- This migration only tightens the remaining gaps:
--   1. Anonymous citizen report submission had almost no validation.
--   2. Defence-in-depth: anon/authenticated should never write to
--      read-only public reference tables, even if a permissive policy
--      is added by mistake later.

-- 1. citizen_reports: constrain what an anonymous INSERT may contain.
DROP POLICY IF EXISTS "Anyone can create citizen reports" ON public.citizen_reports;
CREATE POLICY "Anyone can create citizen reports"
ON public.citizen_reports
FOR INSERT
TO anon, authenticated
WITH CHECK (
  report_type IS NOT NULL
  AND length(trim(report_type)) BETWEEN 1 AND 64
  AND (infrastructure_type IS NULL OR length(infrastructure_type) <= 64)
  AND (description IS NULL OR length(description) <= 2000)
  -- New reports always start as pending; clients cannot self-approve.
  AND status = 'pending'
  -- Coordinates, if given, must be roughly within South Africa.
  AND (latitude  IS NULL OR latitude  BETWEEN -35.5 AND -21.5)
  AND (longitude IS NULL OR longitude BETWEEN 16.0 AND 33.5)
);

-- No client may edit or delete reports.
REVOKE UPDATE, DELETE ON public.citizen_reports FROM anon, authenticated;

-- 2. Read-only public reference / feed tables: no client writes.
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'beaches','city_kpis','crime_stats','emergency_call_aggregates','flight_status',
    'geo_districts','geo_local_municipalities','geo_regions','geo_suburbs',
    'geo_ward_suburbs','geo_wards','health_facilities','hiking_trails',
    'incident_clusters','infrastructure_status','loadshedding_status',
    'neighborhood_ratings','ontology_entities','ontology_entity_types',
    'ontology_relationship_types','ontology_relationships','risk_scores',
    'running_routes','safe_zones','safety_services','saps_stations',
    'suburb_intelligence','traffic_signals','train_routes','wards',
    'water_outages','water_status','weather_data','wind_reports',
    'cctv_assets','api_cache','audit_log','data_retention_policies',
    'data_source_health','ontology_lineage'
  ] LOOP
    IF to_regclass('public.' || t) IS NOT NULL THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
      EXECUTE format('REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.%I FROM anon, authenticated', t);
    END IF;
  END LOOP;
END $$;
