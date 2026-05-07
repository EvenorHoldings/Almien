
-- SAPS stations
CREATE TABLE public.saps_stations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  station_code text UNIQUE,
  phone text,
  address text,
  suburb text,
  ward_number integer,
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  is_24h boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.saps_stations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read SAPS stations"
  ON public.saps_stations FOR SELECT
  USING (true);

CREATE TRIGGER trg_saps_stations_updated_at
  BEFORE UPDATE ON public.saps_stations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Health facilities
CREATE TABLE public.health_facilities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  facility_type text NOT NULL CHECK (facility_type IN ('hospital','clinic','day_hospital','community_health_centre')),
  phone text,
  emergency_phone text,
  address text,
  suburb text,
  ward_number integer,
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  has_trauma_unit boolean NOT NULL DEFAULT false,
  is_24h boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.health_facilities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read health facilities"
  ON public.health_facilities FOR SELECT
  USING (true);

CREATE TRIGGER trg_health_facilities_updated_at
  BEFORE UPDATE ON public.health_facilities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed: SAPS stations (Cape Town area)
INSERT INTO public.saps_stations (name, station_code, phone, address, suburb, ward_number, latitude, longitude) VALUES
  ('Cape Town Central SAPS','CT-CENT','021 467 8001','Buitenkant Street','Cape Town CBD',77,-33.9275,18.4255),
  ('Sea Point SAPS','SEA-PT','021 430 3700','Main Road','Sea Point',54,-33.9180,18.3830),
  ('Camps Bay SAPS','CAMPS','021 438 1056','Victoria Road','Camps Bay',54,-33.9508,18.3776),
  ('Claremont SAPS','CLRMT','021 657 8003','Main Road','Claremont',58,-33.9836,18.4664),
  ('Wynberg SAPS','WYNB','021 799 8530','Maynard Road','Wynberg',63,-34.0011,18.4685),
  ('Mitchells Plain SAPS','MTCHL','021 370 1600','AZ Berman Drive','Mitchells Plain',82,-34.0473,18.6193),
  ('Khayelitsha SAPS','KHAYA','021 360 1800','Spine Road','Khayelitsha',95,-34.0411,18.6745),
  ('Gugulethu SAPS','GUGS','021 632 4222','NY1','Gugulethu',43,-33.9817,18.5681),
  ('Bellville SAPS','BLVL','021 918 3600','Voortrekker Road','Bellville',6,-33.9020,18.6325),
  ('Athlone SAPS','ATH','021 697 9214','Klipfontein Road','Athlone',49,-33.9696,18.5083),
  ('Table View SAPS','TBLV','021 521 7300','Blaauwberg Road','Table View',107,-33.8254,18.4950),
  ('Hout Bay SAPS','HOUTB','021 791 0260','Atlantic Skipper','Hout Bay',74,-34.0405,18.3500);

-- Seed: Health facilities (Cape Town area)
INSERT INTO public.health_facilities (name, facility_type, phone, emergency_phone, address, suburb, ward_number, latitude, longitude, has_trauma_unit, is_24h) VALUES
  ('Groote Schuur Hospital','hospital','021 404 9111','021 404 4141','Main Road','Observatory',57,-33.9412,18.4647,true,true),
  ('Tygerberg Hospital','hospital','021 938 4911','021 938 5454','Francie van Zijl Drive','Parow',8,-33.8889,18.6112,true,true),
  ('Red Cross War Memorial Children''s Hospital','hospital','021 658 5111','021 658 5111','Klipfontein Road','Rondebosch',57,-33.9722,18.4783,true,true),
  ('Mitchells Plain Hospital','hospital','021 370 2911','021 370 2911','AZ Berman Drive','Mitchells Plain',82,-34.0353,18.6240,true,true),
  ('Khayelitsha District Hospital','hospital','021 360 4200','021 360 4200','Walter Sisulu Road','Khayelitsha',95,-34.0298,18.6713,true,true),
  ('Victoria Hospital','hospital','021 799 1111','021 799 1111','Alphen Hill Road','Wynberg',63,-34.0070,18.4685,false,true),
  ('New Somerset Hospital','hospital','021 402 6911','021 402 6911','Portswood Road','Green Point',77,-33.9050,18.4123,true,true),
  ('Gugulethu Community Health Centre','community_health_centre','021 633 1051',NULL,'NY1','Gugulethu',43,-33.9806,18.5650,false,false),
  ('Hout Bay Clinic','clinic','021 790 1015',NULL,'Empire Avenue','Hout Bay',74,-34.0419,18.3527,false,false),
  ('Sea Point Community Health Centre','community_health_centre','021 434 0212',NULL,'Main Road','Sea Point',54,-33.9176,18.3833,false,false);
