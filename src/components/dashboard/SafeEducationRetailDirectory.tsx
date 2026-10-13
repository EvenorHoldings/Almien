import { useState, useMemo, memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  GraduationCap, ShoppingBag, School, Phone, MapPin, Search, Shield, ExternalLink
} from 'lucide-react';
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger
} from '@/components/ui/accordion';

/* ── Emergency contacts (pinned) ───────────────────────── */
const emergencyContacts = [
  { label: 'Police (SAPS)', number: '10111' },
  { label: 'Cape Town Fire / Ambulance', number: '021 480 7700' },
  { label: 'National Crime Stop', number: '08600 10111' },
];

/* ── Directory data ────────────────────────────────────── */
export interface DirectoryEntry {
  name: string;
  type: 'university' | 'mall' | 'school';
  schoolLevel?: string;
  suburb: string;
  ward?: string;
  postalCode: string;
  address?: string;
  mainContact: string;
  securityLine?: string;
}

const directoryData: DirectoryEntry[] = [
  // Universities & Colleges
  { name: 'University of Cape Town (UCT)', type: 'university', suburb: 'Rondebosch', ward: '1', postalCode: '7701', address: 'Lovers Lane, Rondebosch', mainContact: '021 650 9111', securityLine: '021 650 2222' },
  { name: 'University of the Western Cape (UWC)', type: 'university', suburb: 'Bellville', ward: '~35', postalCode: '7535', address: 'Robert Sobukwe Road, Bellville', mainContact: '021 959 2911', securityLine: '021 959 2999' },
  { name: 'CPUT Bellville Campus', type: 'university', suburb: 'Bellville', ward: '', postalCode: '7535', address: 'Symphony Way', mainContact: '021 959 6201', securityLine: '021 959 6767' },
  { name: 'Stellenbosch University', type: 'university', suburb: 'Stellenbosch', ward: '', postalCode: '7600', address: 'Stellenbosch', mainContact: '021 808 9111' },
  { name: 'Boston City Campus Cape Town', type: 'university', suburb: 'Cape Town CBD', ward: '', postalCode: '8001', address: 'CBD', mainContact: '021 421 3020' },
  { name: 'Damelin Cape Town', type: 'university', suburb: 'Claremont', ward: '', postalCode: '7708', address: 'Claremont', mainContact: '021 671 3000' },
  // Shopping Malls
  { name: 'V&A Waterfront', type: 'mall', suburb: 'Cape Town CBD', ward: '', postalCode: '8001', address: '3 Dock Road', mainContact: '021 408 7600', securityLine: '021 408 7100' },
  { name: 'Canal Walk', type: 'mall', suburb: 'Century City', ward: '', postalCode: '7441', address: 'Century Boulevard', mainContact: '021 529 9699', securityLine: '021 555 4400' },
  { name: 'Blue Route Mall', type: 'mall', suburb: 'Tokai', ward: '', postalCode: '7945', address: '16 Tokai Road', mainContact: '021 715 0000' },
  { name: 'Cavendish Square', type: 'mall', suburb: 'Claremont', ward: '', postalCode: '7708', address: 'Dreyer Street', mainContact: '021 657 5500' },
  { name: 'Golden Acre', type: 'mall', suburb: 'Cape Town CBD', ward: '', postalCode: '8001', address: 'Adderley Street', mainContact: '021 569 2559' },
  { name: 'Kenilworth Centre', type: 'mall', suburb: 'Kenilworth', ward: '', postalCode: '7708', address: '1 Doncaster Road', mainContact: '021 671 0230' },
  { name: 'Riverlands Mall', type: 'mall', suburb: 'Observatory', ward: '', postalCode: '7925', address: 'Observatory', mainContact: '021 013 7133' },
  // Schools
  { name: 'Rondebosch Boys\' High School', type: 'school', schoolLevel: 'High', suburb: 'Rondebosch', ward: '', postalCode: '7700', mainContact: '021 686 4000' },
  { name: 'Rustenburg Girls\' High School', type: 'school', schoolLevel: 'High', suburb: 'Rondebosch', ward: '', postalCode: '7700', mainContact: '021 689 2451' },
  { name: 'Westerford High School', type: 'school', schoolLevel: 'High', suburb: 'Newlands', ward: '', postalCode: '7700', mainContact: '021 689 9155' },
  { name: 'Herzlia High School', type: 'school', schoolLevel: 'Private High', suburb: 'Vredehoek', ward: '', postalCode: '8001', mainContact: '021 464 0200' },
  { name: 'Micklefield School', type: 'school', schoolLevel: 'Primary (Girls)', suburb: 'Rondebosch', ward: '', postalCode: '7700', mainContact: '021 689 1189' },
  { name: 'El Shaddai Christian School', type: 'school', schoolLevel: 'Primary/High', suburb: 'Durbanville', ward: '', postalCode: '7550', mainContact: '021 976 1022' },
  { name: 'Camps Bay High School', type: 'school', schoolLevel: 'High', suburb: 'Camps Bay', ward: '', postalCode: '8040', mainContact: '021 438 2400' },
  { name: 'Delft Primary & High Cluster', type: 'school', schoolLevel: 'Primary/High', suburb: 'Delft', ward: '13', postalCode: '7785', mainContact: 'Via WCED' },
];

/* ── Helpers ────────────────────────────────────────────── */
const telHref = (num: string) => `tel:${num.replace(/\s/g, '')}`;
const mapsHref = (address: string) => `https://maps.google.com/?q=${encodeURIComponent(address + ', Cape Town, South Africa')}`;

const typeIcons = {
  university: GraduationCap,
  mall: ShoppingBag,
  school: School,
};

/* ── Entry Row ─────────────────────────────────────────── */
const EntryRow = ({ entry }: { entry: DirectoryEntry }) => {
  const Icon = typeIcons[entry.type];
  return (
    <AccordionItem value={entry.name} className="border-border/30">
      <AccordionTrigger className="py-2.5 hover:no-underline group">
        <div className="flex items-center gap-2 min-w-0 text-left">
          <Icon className="w-3.5 h-3.5 text-primary shrink-0" />
          <span className="text-xs font-medium text-foreground truncate">{entry.name}</span>
          {entry.schoolLevel && (
            <Badge variant="outline" className="text-[9px] px-1 py-0 shrink-0 border-border/50">{entry.schoolLevel}</Badge>
          )}
        </div>
      </AccordionTrigger>
      <AccordionContent className="pb-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-xs pl-5">
          <div><span className="text-muted-foreground">Suburb:</span> <span className="text-foreground">{entry.suburb}</span></div>
          {entry.ward && <div><span className="text-muted-foreground">Ward:</span> <span className="text-foreground">{entry.ward}</span></div>}
          <div><span className="text-muted-foreground">Postal:</span> <span className="text-foreground">{entry.postalCode}</span></div>
          {entry.address && <div><span className="text-muted-foreground">Address:</span> <span className="text-foreground">{entry.address}</span></div>}
        </div>
        <div className="flex flex-wrap gap-2 mt-2.5 pl-5">
          <a href={telHref(entry.mainContact)} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-primary/10 text-primary text-[11px] font-medium hover:bg-primary/20 transition-colors">
            <Phone className="w-3 h-3" /> {entry.mainContact}
          </a>
          {entry.securityLine && (
            <a href={telHref(entry.securityLine)} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-destructive/10 text-destructive text-[11px] font-medium hover:bg-destructive/20 transition-colors">
              <Shield className="w-3 h-3" /> Security: {entry.securityLine}
            </a>
          )}
          {entry.address && (
            <a href={mapsHref(entry.address)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-muted text-foreground text-[11px] font-medium hover:bg-muted/80 transition-colors">
              <MapPin className="w-3 h-3" /> Maps
            </a>
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};

/* ── Main component ────────────────────────────────────── */
const SafeEducationRetailDirectory = memo(() => {
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('universities');

  const typeMap: Record<string, DirectoryEntry['type']> = {
    universities: 'university',
    malls: 'mall',
    schools: 'school',
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return directoryData.filter(e => {
      if (e.type !== typeMap[tab]) return false;
      if (!q) return true;
      return (
        e.name.toLowerCase().includes(q) ||
        e.suburb.toLowerCase().includes(q) ||
        e.postalCode.includes(q) ||
        (e.ward && e.ward.toLowerCase().includes(q))
      );
    });
  }, [search, tab]);

  return (
    <Card className="lg:col-span-2 bg-card/80 backdrop-blur-sm border-border/50 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
      <CardHeader className="pb-2 px-4 pt-4">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <GraduationCap className="w-4 h-4 text-primary" />
          Safe Education & Retail Directory
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-3">
        {/* Emergency Contacts — pinned */}
        <div className="flex flex-wrap gap-2">
          {emergencyContacts.map(ec => (
            <a key={ec.number} href={telHref(ec.number)} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-[11px] font-semibold hover:bg-destructive/20 transition-colors">
              <Phone className="w-3 h-3" /> {ec.label}: {ec.number}
            </a>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Search by name, suburb, postal code…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="h-8 pl-8 text-xs"
          />
        </div>

        {/* Tabs */}
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="h-8 bg-muted/30 p-0.5 w-full">
            <TabsTrigger value="universities" className="text-[11px] flex-1 h-7 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <GraduationCap className="w-3 h-3 mr-1" /> Universities
            </TabsTrigger>
            <TabsTrigger value="malls" className="text-[11px] flex-1 h-7 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <ShoppingBag className="w-3 h-3 mr-1" /> Malls
            </TabsTrigger>
            <TabsTrigger value="schools" className="text-[11px] flex-1 h-7 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <School className="w-3 h-3 mr-1" /> Schools
            </TabsTrigger>
          </TabsList>

          {['universities', 'malls', 'schools'].map(key => (
            <TabsContent key={key} value={key} className="mt-2">
              {filtered.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">No results found.</p>
              ) : (
                <Accordion type="multiple" className="space-y-0">
                  {filtered.map(entry => (
                    <EntryRow key={entry.name} entry={entry} />
                  ))}
                </Accordion>
              )}
            </TabsContent>
          ))}
        </Tabs>

        {/* Footer */}
        <div className="pt-2 mt-1 border-t border-border/50 flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-[10px] text-muted-foreground/70">
            Verified sources: UCT/UWC/CPUT official sites, City of Cape Town & WCED directories (2026) • V&A/Canal Walk management
          </span>
          <span className="text-[10px] text-muted-foreground/50">•</span>
          <span className="text-[10px] text-muted-foreground/70">Always confirm current details</span>
          <span className="text-[10px] text-muted-foreground/50">•</span>
          <a
            href="https://wcedemis.westerncape.gov.za/wced/findaschool.html"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-primary/70 hover:text-primary flex items-center gap-0.5"
          >
            WCED Find-a-School <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </div>
      </CardContent>
    </Card>
  );
});

SafeEducationRetailDirectory.displayName = 'SafeEducationRetailDirectory';
export default SafeEducationRetailDirectory;
