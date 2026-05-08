import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { isInCapeTown } from '@/utils/mockDataValidator';

export interface CrimeAlert {
  id: string;
  type: string;
  location: { lat: number; lng: number; address: string };
  timestamp: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  distance?: number;
  verified: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  phone: string;
  email: string;
  homeLocation: { lat: number; lng: number; address: string };
  safetyScore: number;
  emergencyContacts: Array<{ name: string; phone: string; relation: string }>;
  subscriptionTier: 'free' | 'trial' | 'elite';
  /** Plan the user picked at the paywall (only set once converted/trialing). */
  selectedPlan?: 'standard-monthly' | 'standard-annual' | 'township-monthly' | 'township-annual' | 'family-monthly';
  /** ISO timestamp when the 7-day Safi trial was activated. */
  trialStartedAt?: string | null;
}

interface AlmienStore {
  crimeAlerts: CrimeAlert[];
  userProfile: UserProfile | null;
  isLoading: boolean;
  lastSync: string | null;

  // Opt-in safety preferences (privacy-first, all default OFF)
  roadSafetyMode: boolean;       // Shows ward-level historical crime heatmap on roads
  safiHotwordEnabled: boolean;   // "Hey Safi" wake-word listener
  safiVoiceReplies: boolean;     // Read Safi replies aloud (auto-on in driving mode)
  safiPatternConsent: boolean;   // Consent for behaviour-aware notifications

  addCrimeAlert: (alert: CrimeAlert) => void;
  updateUserProfile: (profile: Partial<UserProfile>) => void;
  markAlertAsRead: (alertId: string) => void;
  refreshData: () => void;
  setSafetyScore: (score: number) => void;
  toggleRoadSafetyMode: () => void;
  toggleSafiHotword: () => void;
  toggleSafiVoiceReplies: () => void;
  toggleSafiPatternConsent: () => void;

  // Monetisation funnel
  startSafiTrial: () => void;
  upgradeToElite: (plan: NonNullable<UserProfile['selectedPlan']>) => void;
  cancelSubscription: () => void;
}

const capeTownLocations = [
  { lat: -33.9249, lng: 18.4241, address: 'Long Street, Cape Town CBD' },
  { lat: -33.9258, lng: 18.4232, address: 'Bree Street, Cape Town City Centre' },
  { lat: -34.0547, lng: 18.4670, address: 'NY1 Main Road, Khayelitsha' },
  { lat: -33.9321, lng: 18.8602, address: 'Lansdowne Road, Claremont' },
  { lat: -33.9715, lng: 18.4606, address: 'Voortrekker Road, Bellville South' },
  { lat: -33.9608, lng: 18.4094, address: 'Main Road, Sea Point' },
  { lat: -34.0037, lng: 18.4464, address: 'Imam Haron Road, Lansdowne' },
  { lat: -33.9876, lng: 18.4774, address: 'AZ Berman Drive, Athlone' },
  { lat: -34.0333, lng: 18.4833, address: 'Steve Biko Road, Gugulethu' },
  { lat: -33.9167, lng: 18.4167, address: 'Kloof Street, Gardens' },
];

const crimeTypes = [
  'Armed Robbery', 'House Breaking', 'Vehicle Theft', 'Motor Vehicle Theft',
  'Assault GBH', 'Burglary Residential', 'Theft out of Vehicle',
  'Common Assault', 'Robbery with Aggravating Circumstances',
];

function generateMockCrimeAlerts(): CrimeAlert[] {
  const severities: Array<'critical' | 'high' | 'medium' | 'low'> = ['critical', 'high', 'high', 'medium', 'medium', 'low'];
  return Array.from({ length: 20 }, (_, i) => {
    const location = capeTownLocations[Math.floor(Math.random() * capeTownLocations.length)];
    const crimeType = crimeTypes[Math.floor(Math.random() * crimeTypes.length)];
    const severity = severities[Math.floor(Math.random() * severities.length)];
    const hoursAgo = Math.random() * 48;
    return {
      id: `alert-${Date.now()}-${i}`,
      type: crimeType,
      location,
      timestamp: new Date(Date.now() - hoursAgo * 3600000).toISOString(),
      severity,
      description: `${crimeType} reported in ${location.address}. SAPS responded. Case opened.`,
      distance: Math.random() * 8,
      verified: Math.random() > 0.2,
    };
  })
    .filter((a) => isInCapeTown(a.location))
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export const useAlmienStore = create<AlmienStore>()(
  persist(
    (set) => ({
      crimeAlerts: generateMockCrimeAlerts(),
      userProfile: {
        id: 'user-demo-001',
        name: 'Thabo Khumalo',
        phone: '+27 82 555 1234',
        email: 'thabo.khumalo@example.com',
        homeLocation: { lat: -33.9249, lng: 18.4241, address: '15 Loop Street, Gardens, Cape Town, 8001' },
        safetyScore: 78,
        emergencyContacts: [
          { name: 'Nomsa Khumalo', phone: '+27 82 555 5678', relation: 'Spouse' },
          { name: 'Sipho Dlamini', phone: '+27 81 444 9876', relation: 'Brother' },
          { name: 'Dr. Lerato Mthembu', phone: '+27 21 555 3333', relation: 'Doctor' },
        ],
        subscriptionTier: 'free',
        trialStartedAt: null,
      },
      isLoading: false,
      lastSync: new Date().toISOString(),

      // Privacy-first defaults — every advanced safety feature is opt-in
      roadSafetyMode: false,
      safiHotwordEnabled: false,
      safiVoiceReplies: false,
      safiPatternConsent: false,

      toggleRoadSafetyMode: () => set((s) => ({ roadSafetyMode: !s.roadSafetyMode })),
      toggleSafiHotword: () => set((s) => ({ safiHotwordEnabled: !s.safiHotwordEnabled })),
      toggleSafiVoiceReplies: () => set((s) => ({ safiVoiceReplies: !s.safiVoiceReplies })),
      toggleSafiPatternConsent: () => set((s) => ({ safiPatternConsent: !s.safiPatternConsent })),

      addCrimeAlert: (alert) => {
        set((state) => ({
          crimeAlerts: [alert, ...state.crimeAlerts].slice(0, 50),
        }));
      },

      updateUserProfile: (updates) => {
        set((state) => ({
          userProfile: state.userProfile ? { ...state.userProfile, ...updates } : null,
        }));
      },

      markAlertAsRead: (alertId) => {
        set((state) => ({
          crimeAlerts: state.crimeAlerts.filter((alert) => alert.id !== alertId),
        }));
      },

      refreshData: () => {
        set({ isLoading: true });
        setTimeout(() => {
          set({
            crimeAlerts: generateMockCrimeAlerts(),
            isLoading: false,
            lastSync: new Date().toISOString(),
          });
        }, 800);
      },

      setSafetyScore: (score) => {
        set((state) => ({
          userProfile: state.userProfile ? { ...state.userProfile, safetyScore: score } : null,
        }));
      },

      // ── Monetisation funnel actions ───────────────────────────────────
      // Free-core safety features (SOS, GBV, crime map, basic routes) are NEVER gated.
      // These actions only affect AI/insight features.
      startSafiTrial: () => {
        set((state) => ({
          userProfile: state.userProfile
            ? {
                ...state.userProfile,
                subscriptionTier: 'trial',
                trialStartedAt: new Date().toISOString(),
              }
            : null,
        }));
      },
      upgradeToElite: (plan) => {
        set((state) => ({
          userProfile: state.userProfile
            ? { ...state.userProfile, subscriptionTier: 'elite', selectedPlan: plan }
            : null,
        }));
      },
      cancelSubscription: () => {
        set((state) => ({
          userProfile: state.userProfile
            ? { ...state.userProfile, subscriptionTier: 'free', selectedPlan: undefined, trialStartedAt: null }
            : null,
        }));
      },
    }),
    {
      name: 'almien-storage',
      partialize: (state) => ({
        userProfile: state.userProfile,
        crimeAlerts: state.crimeAlerts.slice(0, 15),
        roadSafetyMode: state.roadSafetyMode,
        safiHotwordEnabled: state.safiHotwordEnabled,
        safiVoiceReplies: state.safiVoiceReplies,
        safiPatternConsent: state.safiPatternConsent,
      }),
    }
  )
);
