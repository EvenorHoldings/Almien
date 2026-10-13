import { memo, useState } from 'react';
import { cn } from '@/lib/utils';
import { MessageSquare, ChevronDown, ChevronUp, Plus, Share2 } from 'lucide-react';
import type { ViewId } from '../AlmienDashboard';
import DemoBadge from '@/components/DemoBadge';

interface Props {
  onUpgrade: (trigger?: string) => void;
  onNavigate: (view: ViewId) => void;
  onOpenSafi?: () => void;
}

const mockDays = [
  {
    label: 'Today',
    briefing: 'Sea Point: 3 active incidents. Risk elevated 17:00–20:00. Stage 2 load-shedding tonight.',
    conversations: [
      { id: '1', preview: 'Is it safe to run at 6am?', time: '06:12', messages: [
        { role: 'user' as const, text: 'Is it safe to run at 6am?' },
        { role: 'safi' as const, text: '🏃 Morning runs in Sea Point are safest 06:00–07:30. SAPS patrol Promenade from 05:45. Today\'s risk: LOW until 08:15.' },
      ]},
    ],
  },
  {
    label: 'Yesterday',
    briefing: 'Sea Point: Quiet day. 1 theft on Beach Road. No load-shedding.',
    conversations: [
      { id: '2', preview: 'Safe route to CBD', time: '07:45', messages: [
        { role: 'user' as const, text: 'Safe route to CBD' },
        { role: 'safi' as const, text: '🧭 M3 via UCT recommended. Safety score 7.8/10. ETA 18 min.' },
      ]},
      { id: '3', preview: 'Load-shedding tonight?', time: '17:30', messages: [
        { role: 'user' as const, text: 'Load-shedding tonight?' },
        { role: 'safi' as const, text: '⚡ No scheduled load-shedding for Sea Point tonight. Stage 0 active.' },
      ]},
    ],
  },
  {
    label: 'Monday 7 April',
    briefing: 'Sea Point: 4 vehicle break-ins overnight. Stage 4 load-shedding. Guardian Priority One triggered.',
    conversations: [],
  },
];

const SafiConversationsView = memo(({ onOpenSafi }: Props) => {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-headline text-foreground flex items-center gap-2">
            <span className="text-accent-safe font-neural">✦</span> SAFI — INTELLIGENCE HISTORY
           <DemoBadge className="ml-2 align-middle" /></h1>
          <p className="text-xs text-muted-foreground mt-1">Past briefings and conversations</p>
        </div>
        <button
          onClick={onOpenSafi}
          className="px-3 py-2 rounded-lg bg-accent-safe text-white text-xs font-bold flex items-center gap-1.5 min-h-[36px]"
        >
          <Plus className="w-3.5 h-3.5" /> New Chat
        </button>
      </div>

      {mockDays.map(day => (
        <div key={day.label}>
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">{day.label}</h2>

          {/* Daily briefing summary */}
          <div className="p-4 rounded-xl bg-card border border-border-subtle mb-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-accent-safe" />
              <span className="text-[10px] font-neural font-bold text-muted-foreground uppercase tracking-wider">Daily Briefing</span>
            </div>
            <p className="text-sm text-foreground">{day.briefing}</p>
          </div>

          {/* Conversations */}
          {day.conversations.map(conv => (
            <div key={conv.id} className="border border-border-subtle rounded-xl mb-2 overflow-hidden">
              <button
                onClick={() => setExpanded(expanded === conv.id ? null : conv.id)}
                className="w-full flex items-center justify-between p-3 text-left hover:bg-secondary/50 transition-colors min-h-[44px]"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground truncate">{conv.preview}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-neural text-muted-foreground">{conv.time}</span>
                  {expanded === conv.id ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
                </div>
              </button>
              {expanded === conv.id && (
                <div className="px-3 pb-3 space-y-2 animate-fade-in border-t border-border-subtle pt-2">
                  {conv.messages.map((msg, i) => (
                    <div key={i} className={cn("flex", msg.role === 'user' ? "justify-end" : "justify-start")}>
                      <div className={cn(
                        "max-w-[85%] rounded-2xl px-3 py-2 text-xs",
                        msg.role === 'user' ? "bg-accent-safe/15 text-foreground" : "bg-secondary text-foreground"
                      )}>
                        {msg.role === 'safi' && <span className="text-accent-safe font-neural mr-1">✦</span>}
                        {msg.text}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
});

SafiConversationsView.displayName = 'SafiConversationsView';
export default SafiConversationsView;
