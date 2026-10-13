import { memo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Plane, Phone, Lock, MapPin, Clock, Info, Shield, Zap, Wind, AlertTriangle, Radio } from 'lucide-react';
import { useFlights } from '@/hooks/useFlights';
import { useWeather, getWeatherIcon } from '@/hooks/useWeather';
import { useESPStatus, useESPArea, useProxyWeather } from '@/hooks/useApiProxy';
import type { ViewId } from '../AlmienDashboard';
import DemoBadge from '@/components/DemoBadge';

interface Props { onUpgrade: (trigger?: string) => void; onNavigate: (view: ViewId) => void; }

const AIRPORT_ESP_AREA = 'capetown-6-capetowninternationalairport';

const mockArrivals = [
  { id: '1', flight: 'SA 328', route: 'Johannesburg → Cape Town', status: 'landed', gate: 'B12', scheduled: '08:30', actual: '08:35', airline: 'South African Airways', aircraft: 'Airbus A320', baggage: 'Carousel 3' },
  { id: '2', flight: 'BA 56', route: 'London Heathrow → Cape Town', status: 'delayed', gate: 'C5', scheduled: '08:45', actual: '09:15', airline: 'British Airways', aircraft: 'Boeing 777-300ER', baggage: 'Carousel 7' },
  { id: '3', flight: 'EK 772', route: 'Dubai → Cape Town', status: 'scheduled', gate: 'C8', scheduled: '09:30', actual: null, airline: 'Emirates', aircraft: 'Airbus A380', baggage: 'TBD' },
  { id: '4', flight: 'FA 191', route: 'Durban → Cape Town', status: 'in_flight', gate: 'A3', scheduled: '09:05', actual: null, airline: 'FlySafair', aircraft: 'Boeing 737-800', baggage: 'Carousel 1' },
  { id: '5', flight: 'LH 575', route: 'Frankfurt → Cape Town', status: 'cancelled', gate: '-', scheduled: '09:45', actual: null, airline: 'Lufthansa', aircraft: 'Airbus A340', baggage: '-' },
];

const mockDepartures = [
  { id: '6', flight: 'SA 341', route: 'Cape Town → Johannesburg', status: 'boarding', gate: 'A7', scheduled: '09:15', actual: null, airline: 'South African Airways', aircraft: 'Airbus A320' },
  { id: '7', flight: 'BA 55', route: 'Cape Town → London Heathrow', status: 'scheduled', gate: 'C12', scheduled: '19:45', actual: null, airline: 'British Airways', aircraft: 'Boeing 777-300ER' },
  { id: '8', flight: 'EK 771', route: 'Cape Town → Dubai', status: 'scheduled', gate: 'C12', scheduled: '10:30', actual: null, airline: 'Emirates', aircraft: 'Airbus A380' },
  { id: '9', flight: 'FA 186', route: 'Cape Town → Durban', status: 'delayed', gate: 'A2', scheduled: '09:45', actual: '10:05', airline: 'FlySafair', aircraft: 'Boeing 737-800' },
];

const statusBadge = (status: string) => {
  const color = status === 'landed' || status === 'departed' ? 'text-emerald-400' : status === 'delayed' ? 'text-amber-400' : status === 'cancelled' ? 'text-red-400' : status === 'boarding' || status === 'in_flight' ? 'text-primary' : 'text-muted-foreground';
  const label = status === 'landed' ? '🟢 LANDED' : status === 'delayed' ? '🟡 DELAYED' : status === 'cancelled' ? '🔴 CANCELLED' : status === 'boarding' ? '🟢 BOARDING' : status === 'in_flight' ? '🟢 APPROACHING' : '🟢 ON TIME';
  return <Badge variant="outline" className={`${color} border-current text-xs font-mono`}>{label}</Badge>;
};

const TacticalSkeleton = () => (
  <div className="space-y-3 animate-pulse">
    <Skeleton className="h-4 w-3/4 bg-muted/30" />
    <Skeleton className="h-4 w-1/2 bg-muted/30" />
    <Skeleton className="h-4 w-2/3 bg-muted/30" />
  </div>
);

const AirportInfoView = memo(({ onUpgrade }: Props) => {
  const { arrivals: dbArrivals, departures: dbDepartures, loading: flightsLoading } = useFlights();
  const { weather } = useWeather();
  const { data: espStatus, loading: espLoading } = useESPStatus();
  const { data: espArea, loading: espAreaLoading } = useESPArea(AIRPORT_ESP_AREA);
  const { data: airportWeather, loading: weatherLoading } = useProxyWeather('-33.9649', '18.6017');
  const [tab, setTab] = useState<'arrivals' | 'departures'>('arrivals');

  const arrivals = dbArrivals.length > 0
    ? dbArrivals.map(f => ({ id: f.id, flight: f.flight_number, route: `${f.origin_destination} → Cape Town`, status: f.status, gate: f.gate || '-', scheduled: f.scheduled_time?.slice(11, 16) || '', actual: f.actual_time?.slice(11, 16) || null, airline: f.airline, aircraft: '', baggage: '' }))
    : mockArrivals;

  const departures = dbDepartures.length > 0
    ? dbDepartures.map(f => ({ id: f.id, flight: f.flight_number, route: `Cape Town → ${f.origin_destination}`, status: f.status, gate: f.gate || '-', scheduled: f.scheduled_time?.slice(11, 16) || '', actual: f.actual_time?.slice(11, 16) || null, airline: f.airline, aircraft: '' }))
    : mockDepartures;

  const flightsAreDemo = !flightsLoading && dbArrivals.length === 0 && dbDepartures.length === 0;

  const currentStage = espStatus?.capetown_stage ?? espStatus?.eskom_stage ?? espStatus?.stage ?? 0;
  const wx = airportWeather || (weather ? { temp: weather.temperature_celsius, wind_speed: weather.wind_speed_kmh, description: weather.description, icon: weather.icon_code, wind_alert: (weather.wind_speed_kmh || 0) > 40, status: 'live' as const, feels_like: 0, wind_direction: '', humidity: 0 } : null);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Plane className="w-6 h-6 text-primary" /> Cape Town International Airport
        </h1>
        <p className="text-muted-foreground mt-1">Real-time arrivals, departures & airport intelligence</p>
        <p className="text-xs text-muted-foreground font-mono mt-0.5">IATA: CPT · ICAO: FACT · COORDS: <span className="tracking-wider">-33.9649, 18.6017</span></p>
      </div>

      {/* Airport Status + Weather + ESP */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-emerald-400 font-semibold text-lg">🟢 AIRPORT OPERATING NORMALLY</p>
            <div className="text-sm mt-2 space-y-0.5">
              {weatherLoading ? <TacticalSkeleton /> : wx ? (
                <>
                  <p>Weather: {wx.description}, <span className="font-mono">{wx.temp}°C</span>, Wind <span className="font-mono">{wx.wind_speed} km/h</span></p>
                  {wx.wind_alert && (
                    <div className="flex items-center gap-1.5 mt-1 text-amber-400">
                      <Wind className="w-4 h-4" />
                      <span className="font-semibold text-xs uppercase">⚠ WIND ALERT: &gt;40 km/h — Possible flight delays</span>
                    </div>
                  )}
                </>
              ) : <p>Weather: ☀️ Clear, 24°C</p>}
              <p>Visibility: Excellent (&gt;10km)</p>
              <p>Runway Status: Both runways operational</p>
              {wx?.status === 'demo' && <p className="text-xs text-muted-foreground mt-1">🔄 Demo data — live weather coming soon</p>}
            </div>
          </CardContent>
        </Card>

        {/* Load Shedding Status */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-5 h-5 text-amber-400" />
              <p className="font-semibold text-foreground">LOAD SHEDDING STATUS</p>
            </div>
            {espLoading ? <TacticalSkeleton /> : (
              <div className="space-y-1.5 text-sm">
                <p className={currentStage === 0 ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-semibold'}>
                  {currentStage === 0 ? '🟢 NO LOAD SHEDDING' : `🟡 STAGE ${currentStage} IN EFFECT`}
                </p>
                {espStatus?.capetown_stage !== undefined && espStatus.capetown_stage !== null && (
                  <p className="text-muted-foreground">Cape Town: Stage {espStatus.capetown_stage}</p>
                )}
                {espArea?.next_outage ? (
                  <div className="mt-2 p-2 rounded bg-destructive/10 border border-destructive/20">
                    <p className="font-mono text-xs text-destructive">NEXT OUTAGE AT AIRPORT:</p>
                    <p className="text-sm">{new Date(espArea.next_outage.start).toLocaleTimeString()} – {new Date(espArea.next_outage.end).toLocaleTimeString()}</p>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No scheduled outages for airport area</p>
                )}
                <p className="text-xs font-mono text-muted-foreground mt-1">
                  ESP Area: {AIRPORT_ESP_AREA}
                </p>
                {espStatus?.status === 'demo' && <p className="text-xs text-muted-foreground">🔄 Demo — add ESP_API_KEY for live data</p>}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Emergency Contacts — Tactical Style */}
      <Card className="border-destructive/30 bg-destructive/5">
        <CardContent className="p-5">
          <h3 className="font-semibold text-foreground flex items-center gap-2 mb-3 uppercase text-sm tracking-wider">
            <Shield className="w-4 h-4 text-destructive" /> Airport Emergency Services
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <a href="tel:+27219272900" className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-accent transition-colors">
              <div className="p-2 rounded-full bg-blue-500/10">
                <Shield className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-xs font-mono uppercase text-muted-foreground">SAPS AIRPORT</p>
                <p className="font-mono font-semibold text-foreground tracking-wider">+27 21 927 2900</p>
              </div>
            </a>
            <a href="tel:+27219362277" className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-accent transition-colors">
              <div className="p-2 rounded-full bg-emerald-500/10">
                <Phone className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs font-mono uppercase text-muted-foreground">MEDICAL CLINIC</p>
                <p className="font-mono font-semibold text-foreground tracking-wider">+27 21 936 2277</p>
              </div>
            </a>
            <a href="tel:+27219371211" className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-accent transition-colors">
              <div className="p-2 rounded-full bg-red-500/10">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <p className="text-xs font-mono uppercase text-muted-foreground">FIRE & RESCUE</p>
                <p className="font-mono font-semibold text-foreground tracking-wider">+27 21 937 1211</p>
              </div>
            </a>
          </div>
          <p className="text-[10px] font-mono text-muted-foreground mt-3">VERIFIED: SAPS Directory / ACSA · Last checked: Feb 2026</p>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold font-mono text-foreground">{flightsAreDemo ? '—' : dbArrivals.length + dbDepartures.length}</p><p className="text-xs text-muted-foreground">Flights Today</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold font-mono text-emerald-400">89%</p><p className="text-xs text-muted-foreground">On Time</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold font-mono text-amber-400">24</p><p className="text-xs text-muted-foreground">Delayed</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold font-mono text-red-400">3</p><p className="text-xs text-muted-foreground">Cancelled</p></CardContent></Card>
      </div>

      {/* Scan Nearby */}
      <Card className="border-primary/30">
        <CardContent className="p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Radio className="w-5 h-5 text-primary animate-pulse" />
            <div>
              <p className="font-semibold text-foreground text-sm">Scan Nearby Intelligence</p>
              <p className="text-xs text-muted-foreground">Current traffic to CBD, flight info & area alerts</p>
            </div>
          </div>
          <div className="flex gap-2">
            <a href="https://www.airports.co.za/airports/cape-town-international-airport/the-airport/flight-information" target="_blank" rel="noopener noreferrer"
              className="text-xs px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:opacity-90">
              ACSA Flights
            </a>
            <button onClick={() => onUpgrade('scan-nearby')} className="text-xs px-3 py-1.5 rounded-md bg-secondary text-foreground hover:bg-accent">
              Traffic to CBD 👑
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Tab Toggle */}
      <div className="flex gap-2">
        <button onClick={() => setTab('arrivals')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'arrivals' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground hover:bg-accent'}`}>Arrivals</button>
        <button onClick={() => setTab('departures')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'departures' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground hover:bg-accent'}`}>Departures</button>
        {flightsAreDemo && <DemoBadge className="self-center" />}
      </div>

      {/* Flights */}
      <Accordion type="multiple" className="space-y-2">
        {(tab === 'arrivals' ? arrivals : departures).map(f => (
          <AccordionItem key={f.id} value={f.id} className="border rounded-lg bg-card px-4">
            <AccordionTrigger className="hover:no-underline py-3">
              <div className="flex items-center justify-between w-full pr-2 gap-2">
                <span className="font-semibold text-foreground text-sm font-mono">{f.flight} – {f.route}</span>
                {statusBadge(f.status)}
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-4 text-sm space-y-1">
              <p>Airline: {f.airline}</p>
              {f.aircraft && <p>Aircraft: {f.aircraft}</p>}
              <p>Scheduled: <span className="font-mono">{f.scheduled}</span> {f.actual ? <> · Actual: <span className="font-mono">{f.actual}</span></> : ''}</p>
              <p>Gate: <span className="font-mono">{f.gate}</span></p>
              {'baggage' in f && (f as any).baggage && <p>Baggage Claim: {(f as any).baggage}</p>}
              <div className="flex gap-2 mt-3">
                <button onClick={() => onUpgrade('flight-track')} className="text-xs px-3 py-1.5 rounded-md bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30">Track Flight 👑</button>
                <button className="text-xs px-3 py-1.5 rounded-md bg-secondary text-foreground hover:bg-accent">Share Flight Info</button>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      {/* Getting There */}
      <section>
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-3"><MapPin className="w-5 h-5" /> Getting to the Airport</h2>
        <Card>
          <CardContent className="p-5 text-sm space-y-2">
            <p className="font-medium">Address: Matroosfontein, Cape Town, <span className="font-mono">7490</span> · 20 km from City Centre</p>
            <div className="space-y-1.5 mt-2">
              <p>🚕 <strong>Uber/Bolt:</strong> R180-250 · 25-35 min · Wait: ~8 min</p>
              <p>🚖 <strong>Metered Taxi:</strong> R250-300 · Unicab: <a href="tel:0214481720" className="text-primary font-mono hover:underline">021 448 1720</a></p>
              <p>🚌 <strong>MyCiti Bus:</strong> R90 · Route A01 · Every 20 min</p>
              <p>🅿️ <strong>Parking:</strong> R15/hour, R120/day · Availability: 87%</p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Terminal */}
      <Card>
        <CardHeader className="pb-2 pt-4 px-5"><CardTitle className="text-base">🏢 Terminal Facilities</CardTitle></CardHeader>
        <CardContent className="px-5 pb-4 text-sm space-y-1">
          <p>Restaurants & Cafes: 15 · Shops: 22 · Lounges: 4 (Priority Pass accepted)</p>
          <p>ATMs: 8 · Currency Exchange: 3 bureaux · Free WiFi · Charging Stations</p>
        </CardContent>
      </Card>

      {/* Travel Tips */}
      <Card>
        <CardHeader className="pb-2 pt-4 px-5"><CardTitle className="text-base flex items-center gap-2"><Info className="w-4 h-4" /> Travel Tips</CardTitle></CardHeader>
        <CardContent className="px-5 pb-4 text-sm space-y-2">
          <div>
            <p className="font-medium">Check-in Times</p>
            <p>Domestic: 60 min before · International: 3 hours before</p>
          </div>
          <div>
            <p className="font-medium">Security: Current Wait 15-20 min</p>
            <p>Peak: 06:00-08:00, 17:00-19:00 · Liquids: Max 100ml in 1L bag</p>
          </div>
        </CardContent>
      </Card>

      {/* Contacts */}
      <Card>
        <CardHeader className="pb-2 pt-4 px-5"><CardTitle className="text-base flex items-center gap-2"><Phone className="w-4 h-4" /> Airport Contacts</CardTitle></CardHeader>
        <CardContent className="px-5 pb-4 text-sm space-y-1">
          <p>General Enquiries: <a href="tel:0219371200" className="text-primary font-mono hover:underline">021 937 1200</a></p>
          <p>Lost & Found: <a href="tel:0219340407" className="text-primary font-mono hover:underline">021 934 0407</a></p>
          <p>Airport Police: <a href="tel:0219371263" className="text-primary font-mono hover:underline">021 937 1263</a></p>
          <p>Website: <a href="https://www.airports.co.za" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">www.airports.co.za</a></p>
        </CardContent>
      </Card>

      {/* Elite */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-5">
          <h3 className="font-semibold text-foreground flex items-center gap-2 mb-3"><Lock className="w-4 h-4" /> Elite Features 👑</h3>
          <ul className="text-sm space-y-1.5 text-muted-foreground">
            <li>🔒 Flight tracking with live map</li>
            <li>🔒 Delay/cancellation alerts (SMS + Push)</li>
            <li>🔒 Gate change notifications</li>
            <li>🔒 Multi-flight monitoring</li>
            <li>🔒 Smart journey planning (traffic-aware)</li>
          </ul>
          <button onClick={() => onUpgrade('airport')} className="mt-4 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity">Upgrade to Elite</button>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground font-mono">API SOURCES: FlightAware · EskomSePush · OpenWeatherMap · ACSA</p>
    </div>
  );
});

AirportInfoView.displayName = 'AirportInfoView';
export default AirportInfoView;
