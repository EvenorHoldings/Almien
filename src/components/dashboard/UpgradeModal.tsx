import { memo, useState } from 'react';
import { cn } from '@/lib/utils';
import { Crown, X, Check, Shield, Users, Home } from 'lucide-react';
import { useElite } from '@/hooks/useElite';
import { useToast } from '@/hooks/use-toast';
import DemoBadge from '@/components/DemoBadge';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Optional context line shown in the header (e.g. "Daily Briefing locked"). */
  trigger?: string;
}

/**
 * Transparent 3-tier paywall for Almien Phase-1 monetisation funnel.
 *
 * Pricing is fixed and visible to every user — no dynamic / hidden variants.
 * Tier selection is user-driven (no auto-detection of township status) to
 * comply with SA Consumer Protection Act and avoid miscategorisation.
 */

type Cycle = 'monthly' | 'annual';
type PlanKey =
  | 'standard-monthly' | 'standard-annual'
  | 'township-monthly' | 'township-annual'
  | 'family-monthly';

interface Plan {
  id: 'standard' | 'township' | 'family';
  name: string;
  description: string;
  icon: typeof Shield;
  monthly: number;
  annual: number | null;     // null → annual not offered
  annualSavingPct?: number;
  badge?: string;
  highlight?: boolean;
  bullets: string[];
}

const PLANS: Plan[] = [
  {
    id: 'township',
    name: 'Township',
    description: 'Spatial-justice rate for lower-income wards',
    icon: Home,
    monthly: 99,
    annual: 899,
    annualSavingPct: 24,
    bullets: ['Full Safi AI access', 'Unlimited insights', 'Family share for 1 contact', 'Same protection, fair price'],
  },
  {
    id: 'standard',
    name: 'Standard Elite',
    description: 'Full Safi intelligence for one user',
    icon: Shield,
    monthly: 349,
    annual: 3490,
    annualSavingPct: 17,
    badge: 'Most Popular',
    highlight: true,
    bullets: ['Full Safi AI + voice mode', 'Neural Profile + Daily Briefing', 'Unlimited saved locations', 'Exportable safety reports', 'Ad-free, real-time alerts'],
  },
  {
    id: 'family',
    name: 'Family',
    description: 'Up to 5 family members on one plan',
    icon: Users,
    monthly: 699,
    annual: null,
    bullets: ['Everything in Elite × 5', 'Shared Guardian alerts', 'Family safety hub', 'CPF group sync'],
  },
];

const TRUST_POINTS = [
  '7-day free Safi trial — no credit card',
  'Transparent pricing — no hidden fees, no impulse pricing',
  'Cancel anytime in Settings',
  'SOS, GBV support & crime map are FREE forever',
];

const UpgradeModal = memo(({ isOpen, onClose, trigger }: UpgradeModalProps) => {
  const { tier, trialActive, trialDaysRemaining, startSafiTrial, upgradeToElite } = useElite();
  const { toast } = useToast();
  const [cycle, setCycle] = useState<Cycle>('annual');

  if (!isOpen) return null;

  const priceFor = (plan: Plan): number => (cycle === 'annual' && plan.annual ? plan.annual : plan.monthly);
  const cycleSuffix = (plan: Plan) => (cycle === 'annual' && plan.annual ? '/year' : '/month');

  const planKey = (plan: Plan): PlanKey => {
    if (plan.id === 'family') return 'family-monthly';
    return `${plan.id}-${cycle}` as PlanKey;
  };

  const handleStartTrial = () => {
    if (tier === 'free') {
      startSafiTrial();
      toast({
        title: '✦ Safi trial activated',
        description: '7 days of full Safi AI access. No card required.',
      });
    }
    onClose();
  };

  const handleUpgrade = (plan: Plan) => {
    // Mock paywall — no real charge. In production, this is where the
    // payment provider (Paddle / Stripe / EFT) would be invoked.
    upgradeToElite(planKey(plan));
    toast({
      title: `Welcome to Almien ${plan.name}`,
      description: 'Mock payment confirmed. All Elite features unlocked.',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-[860px] bg-card rounded-2xl shadow-2xl border border-border overflow-hidden animate-scale-in max-h-[92dvh] overflow-y-auto">
        <div className="h-1 bg-elite-gradient" />

        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-3 p-2 rounded-lg hover:bg-secondary transition-colors z-10"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>

        {/* Header */}
        <div className="px-6 sm:px-8 pt-7 pb-4 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-elite-gradient text-white text-xs font-semibold mb-3">
            <Crown className="w-3.5 h-3.5" />
            ALMIEN ELITE
          </div>
          <DemoBadge label="Demo checkout — no charge" className="mb-2" />
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">
            {trigger ?? 'Unlock the full Safi intelligence layer'}
          </h2>
          <p className="text-sm text-muted-foreground mt-1.5 max-w-md mx-auto">
            Transparent pricing. Fair tiers. The same safety protection for everyone — pay only for the AI layer.
          </p>

          {trialActive && (
            <div className="mt-3 inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20">
              <Crown className="w-3 h-3" />
              Trial active · {trialDaysRemaining} day{trialDaysRemaining === 1 ? '' : 's'} remaining
            </div>
          )}
        </div>

        {/* Billing cycle toggle */}
        <div className="px-6 sm:px-8 pb-4 flex justify-center">
          <div className="inline-flex rounded-full bg-secondary p-1 text-xs font-semibold">
            <button
              onClick={() => setCycle('monthly')}
              className={cn(
                'px-4 py-1.5 rounded-full transition-colors',
                cycle === 'monthly' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
              )}
            >
              Monthly
            </button>
            <button
              onClick={() => setCycle('annual')}
              className={cn(
                'px-4 py-1.5 rounded-full transition-colors flex items-center gap-1.5',
                cycle === 'annual' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
              )}
            >
              Annual
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-safety-green/15 text-safety-green">SAVE</span>
            </button>
          </div>
        </div>

        {/* Plans */}
        <div className="px-4 sm:px-8 pb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
            {PLANS.map((plan) => {
              const Icon = plan.icon;
              const price = priceFor(plan);
              const annualUnavailable = cycle === 'annual' && !plan.annual;
              return (
                <div
                  key={plan.id}
                  className={cn(
                    'relative p-5 rounded-2xl border bg-surface-base flex flex-col',
                    plan.highlight ? 'border-primary/60 ring-1 ring-primary/30' : 'border-border'
                  )}
                >
                  {plan.badge && (
                    <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[10px] font-bold bg-primary text-primary-foreground px-2.5 py-0.5 rounded-full whitespace-nowrap">
                      {plan.badge}
                    </span>
                  )}

                  <div className="flex items-center gap-2 mb-1">
                    <Icon className="w-4 h-4 text-primary" />
                    <h3 className="font-bold text-foreground text-base">{plan.name}</h3>
                  </div>
                  <p className="text-xs text-muted-foreground mb-4 min-h-[2.5em]">{plan.description}</p>

                  <div className="mb-4">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-foreground">
                        R{annualUnavailable ? plan.monthly : price}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {annualUnavailable ? '/month' : cycleSuffix(plan)}
                      </span>
                    </div>
                    {cycle === 'annual' && plan.annual && plan.annualSavingPct && (
                      <div className="text-[11px] text-safety-green font-semibold mt-0.5">
                        Save {plan.annualSavingPct}% vs monthly
                      </div>
                    )}
                    {annualUnavailable && (
                      <div className="text-[11px] text-muted-foreground mt-0.5">Monthly only</div>
                    )}
                  </div>

                  <ul className="space-y-1.5 mb-5 flex-1">
                    {plan.bullets.map((b) => (
                      <li key={b} className="flex items-start gap-2 text-xs text-foreground">
                        <Check className="w-3.5 h-3.5 text-safety-green shrink-0 mt-0.5" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handleUpgrade(plan)}
                    className={cn(
                      'w-full py-2.5 rounded-lg text-sm font-bold transition-colors',
                      plan.highlight
                        ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                        : 'border border-border text-foreground hover:bg-secondary'
                    )}
                  >
                    Choose {plan.name}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Trial CTA — only shown to free users */}
        {tier === 'free' && (
          <div className="px-6 sm:px-8 pb-4">
            <button
              onClick={handleStartTrial}
              className="w-full py-3 rounded-xl border border-dashed border-primary/40 bg-primary/5 hover:bg-primary/10 transition-colors text-sm font-semibold text-primary"
            >
              ✦ Or start a 7-day free Safi trial — no card, no commitment
            </button>
          </div>
        )}

        {/* Trust strip */}
        <div className="px-6 sm:px-8 pb-7">
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5">
            {TRUST_POINTS.map((p) => (
              <li key={p} className="flex items-start gap-2 text-[11px] text-muted-foreground">
                <Check className="w-3 h-3 text-safety-green shrink-0 mt-0.5" />
                <span>{p}</span>
              </li>
            ))}
          </ul>
          <button
            onClick={onClose}
            className="block mx-auto mt-4 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
});

UpgradeModal.displayName = 'UpgradeModal';
export default UpgradeModal;
