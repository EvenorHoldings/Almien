import { useState } from 'react';
import { Zap } from 'lucide-react';
import { useLoadshedding, getStageColor } from '@/hooks/useLoadshedding';
import LoadSheddingModal from './LoadSheddingModal';

/**
 * Compact amber-pulse chip docked above the score ring.
 * 1-second scan: stage + active/next outage at a glance.
 * Tap → modal with windows + nearest lit safe havens.
 */
const LoadSheddingBadge = () => {
  const { status, loading } = useLoadshedding();
  const [open, setOpen] = useState(false);

  if (loading || !status) return null;

  const isActive = status.is_active;
  const stage = status.stage;
  const nextStage = status.nextStage;
  const tone = isActive ? '#FF9500' : stage > 0 ? getStageColor(stage) : '#7C3AED';

  // Countdown text
  let cd = 'GRID STABLE';
  if (isActive && status.activeUntil) {
    const mins = Math.max(0, Math.round((new Date(status.activeUntil).getTime() - Date.now()) / 60000));
    cd = `OUTAGE ENDS ${mins}m`;
  } else if (status.nextStart && nextStage) {
    const mins = Math.max(0, Math.round((new Date(status.nextStart).getTime() - Date.now()) / 60000));
    cd = mins < 60 ? `STAGE ${nextStage} IN ${mins}m` : `NEXT STAGE ${nextStage}`;
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="View load-shedding schedule"
        className={`mx-auto flex items-center gap-2 px-3 py-1.5 transition-transform active:scale-[0.97] ${isActive ? 'animate-pulse-fresh' : ''}`}
        style={{
          background: '#0A0A0A',
          border: `0.5px solid ${tone}66`,
          color: tone,
        }}
      >
        <Zap size={12} strokeWidth={2.25} fill={isActive ? tone : 'none'} />
        <span className="mono text-[10px]" style={{ letterSpacing: '0.12em' }}>
          STAGE {stage}
        </span>
        <span aria-hidden style={{ width: 1, height: 10, background: '#2A2A2A' }} />
        <span className="mono text-[10px]" style={{ color: '#A0A0A0', letterSpacing: '0.08em' }}>
          {cd}
        </span>
      </button>
      <LoadSheddingModal open={open} onClose={() => setOpen(false)} />
    </>
  );
};

export default LoadSheddingBadge;
