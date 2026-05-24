
CREATE TABLE IF NOT EXISTS public.crime_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ward_id integer NOT NULL REFERENCES public.wards(id) ON DELETE CASCADE,
  crime_type text NOT NULL,
  count integer NOT NULL DEFAULT 0,
  date date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crime_stats_ward_date ON public.crime_stats(ward_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_crime_stats_type ON public.crime_stats(crime_type);
CREATE UNIQUE INDEX IF NOT EXISTS uq_crime_stats_ward_type_date ON public.crime_stats(ward_id, crime_type, date);

ALTER TABLE public.crime_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read crime stats" ON public.crime_stats;
CREATE POLICY "Anyone can read crime stats" ON public.crime_stats FOR SELECT USING (true);

DO $$
DECLARE
  w RECORD;
  i INTEGER;
  r FLOAT := 0.015;
  ring jsonb;
  px FLOAT;
  py FLOAT;
BEGIN
  FOR w IN SELECT id, ward_number, ward_name, lat, lng FROM public.wards WHERE geojson IS NULL AND lat IS NOT NULL AND lng IS NOT NULL LOOP
    ring := '[]'::jsonb;
    FOR i IN 0..24 LOOP
      px := w.lng + r * cos(2 * pi() * i / 24);
      py := w.lat + r * sin(2 * pi() * i / 24);
      ring := ring || jsonb_build_array(jsonb_build_array(to_jsonb(round(px::numeric, 6)), to_jsonb(round(py::numeric, 6))));
    END LOOP;
    UPDATE public.wards
      SET geojson = jsonb_build_object(
        'type', 'Feature',
        'properties', jsonb_build_object('ward_id', w.id, 'ward_number', w.ward_number, 'ward_name', w.ward_name, 'synthetic_boundary', true),
        'geometry', jsonb_build_object('type', 'Polygon', 'coordinates', jsonb_build_array(ring))
      )
      WHERE id = w.id;
  END LOOP;
END $$;

INSERT INTO public.crime_stats (ward_id, crime_type, count, date)
SELECT
  w.id,
  ct.crime_type,
  GREATEST(0, ROUND(
    ct.base_rate
    * (1.0 + (100 - COALESCE(w.safety_score, 50)) / 100.0)
    * CASE WHEN EXTRACT(dow FROM d.day) IN (5, 6) THEN 1.45 ELSE 1.0 END
    * (1.0 + (56 - (CURRENT_DATE - d.day::date)) / 200.0)
    * (0.6 + random() * 0.9)
    * CASE WHEN random() < 0.03 THEN 2.8 + random() * 1.5 ELSE 1.0 END
  ))::int AS count,
  d.day::date AS date
FROM public.wards w
CROSS JOIN (VALUES ('assault', 3.2), ('robbery', 1.8), ('burglary', 2.4), ('theft', 4.1)) AS ct(crime_type, base_rate)
CROSS JOIN generate_series((CURRENT_DATE - INTERVAL '55 days')::timestamp, CURRENT_DATE::timestamp, INTERVAL '1 day') AS d(day)
ON CONFLICT (ward_id, crime_type, date) DO NOTHING;
