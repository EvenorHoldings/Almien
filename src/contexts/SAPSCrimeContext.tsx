import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface SAPSCrimeCategory {
  label: string;
  count: number;
  changePct: number; // negative = decrease
}

export interface SAPSHotspot {
  name: string;
  province: string;
  incidents: number;
}

export interface SAPSCrimeData {
  quarter: string;
  period: string;
  lastSynced: string; // ISO date string
  source: string;
  national: SAPSCrimeCategory[];
  hotspots: SAPSHotspot[];
  totalContactCrimes: { count: number; changePct: number };
  provinceBreakdown: { province: string; carjackingShare: number }[];
  notes: string[];
}

// Official SAPS Q3 2025/26 baseline
const SAPS_Q3_2025_26: SAPSCrimeData = {
  quarter: 'Q3 2025/26',
  period: 'October – December 2025',
  lastSynced: '2026-02-20T00:00:00Z',
  source: 'saps.gov.za',
  national: [
    { label: 'Murder', count: 6953, changePct: -9.8 },
    { label: 'Rape', count: 11803, changePct: -3.3 },
    { label: 'Attempted Murder', count: 7666, changePct: -3.3 },
    { label: 'Aggravated Robbery', count: 35030, changePct: -13.1 },
    { label: 'Carjacking', count: 4807, changePct: -19.5 },
    { label: 'Trio Crimes', count: 14862, changePct: -13.4 },
    { label: 'Cash-in-Transit', count: 29, changePct: 0 },
    { label: 'Kidnapping', count: 0, changePct: 0 }, // rising, no exact total given
  ],
  totalContactCrimes: { count: 187892, changePct: -1.6 },
  hotspots: [
    { name: 'Nyanga', province: 'Western Cape', incidents: 342 },
    { name: 'Mfuleni', province: 'Western Cape', incidents: 298 },
    { name: 'Cape Town Central', province: 'Western Cape', incidents: 276 },
    { name: 'Kempton Park', province: 'Gauteng', incidents: 264 },
    { name: 'Ivory Park', province: 'Gauteng', incidents: 241 },
  ],
  provinceBreakdown: [
    { province: 'Gauteng', carjackingShare: 53 },
    { province: 'KwaZulu-Natal', carjackingShare: 16 },
    { province: 'Western Cape', carjackingShare: 9 },
    { province: 'Mpumalanga', carjackingShare: 7 },
    { province: 'Other', carjackingShare: 15 },
  ],
  notes: [
    'Kidnapping rising in Gauteng — Kempton Park +64 cases',
    'Carjacking: Gauteng accounts for ~53% nationally',
    'Overall contact crimes down 1.6% year-on-year',
  ],
};

interface SAPSCrimeContextValue {
  crimeData: SAPSCrimeData;
  isRefreshing: boolean;
  refreshData: () => void;
}

const SAPSCrimeContext = createContext<SAPSCrimeContextValue | null>(null);

export function SAPSCrimeProvider({ children }: { children: ReactNode }) {
  const [crimeData, setCrimeData] = useState<SAPSCrimeData>(SAPS_Q3_2025_26);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshData = useCallback(() => {
    setIsRefreshing(true);
    // TODO: replace mock refresh with real SAPS fetch. Simulate network delay then reset to baseline (future: real fetch)
    setTimeout(() => {
      setCrimeData(prev => ({ ...prev, lastSynced: new Date().toISOString() }));
      setIsRefreshing(false);
    }, 1500);
  }, []);

  return (
    <SAPSCrimeContext.Provider value={{ crimeData, isRefreshing, refreshData }}>
      {children}
    </SAPSCrimeContext.Provider>
  );
}

export function useSAPSCrime() {
  const ctx = useContext(SAPSCrimeContext);
  if (!ctx) throw new Error('useSAPSCrime must be used within SAPSCrimeProvider');
  return ctx;
}
