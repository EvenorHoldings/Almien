import { useState, useRef, useEffect, memo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import {
  X, Send, Mic, MicOff, Phone, MapPin, Users, Shield, ChevronRight,
  Volume2, VolumeX, Ear, Sparkles, AlertTriangle,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAlmienStore } from '@/stores/almienStore';
import { useUserLocation } from '@/hooks/useUserLocation';
import { useToast } from '@/hooks/use-toast';
import type { ViewId } from '../dashboard/AlmienDashboard';

interface SafiAIProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (view: ViewId) => void;
  initialMode?: 'chat' | 'briefing' | 'route' | 'emergency';
}

type Role = 'user' | 'assistant';
interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: Date;
}

// Static fallbacks — overridden at runtime by store + geolocation
const FALLBACK_CTX = { suburb: 'Sea Point', commute: 'CBD', riskTolerance: 'moderate' };

const QUICK_PROMPTS = [
  'Is it safe to run at 6am?',
  'Safest route to CBD now',
  'GBV resources nearby',
  'Load-shedding risk tonight',
];

const STREAM_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/safi-chat`;
const PUBLIC_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'MORNING';
  if (h < 17) return 'AFTERNOON';
  return 'EVENING';
};

const fmtTime = (d: Date) =>
  d.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit', hour12: false });

const SafiAI = memo(({ isOpen, onClose, onNavigate, initialMode = 'chat' }: SafiAIProps) => {
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const safiVoiceReplies = useAlmienStore((s) => s.safiVoiceReplies);
  const toggleSafiVoiceReplies = useAlmienStore((s) => s.toggleSafiVoiceReplies);
  const safiHotwordEnabled = useAlmienStore((s) => s.safiHotwordEnabled);
  const toggleSafiHotword = useAlmienStore((s) => s.toggleSafiHotword);
  const homeLocation = useAlmienStore((s) => s.userProfile?.homeLocation);
  const { coords, nearestSuburb, nearestArea } = useUserLocation();

  // Live, location/time-aware context — falls back to defaults when geolocation is unavailable
  const userContext = {
    suburb: nearestSuburb?.name ?? nearestArea?.name ?? FALLBACK_CTX.suburb,
    commute: homeLocation?.address ?? FALLBACK_CTX.commute,
    riskTolerance: FALLBACK_CTX.riskTolerance,
    coords: coords ?? null,
    homeLocation: homeLocation ?? null,
  };

  const [mode, setMode] = useState<'chat' | 'briefing' | 'route' | 'emergency'>(initialMode);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [hotwordActive, setHotwordActive] = useState(false);

  const [voiceSupported] = useState(
    () =>
      typeof window !== 'undefined' &&
      ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window),
  );
  const [ttsSupported] = useState(
    () => typeof window !== 'undefined' && 'speechSynthesis' in window,
  );
  const recognitionRef = useRef<any>(null);
  const hotwordRef = useRef<any>(null);
  const abortRef = useRef<AbortController | null>(null);
  const scrollEndRef = useRef<HTMLDivElement>(null);

  // Seed greeting
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: '0',
          role: 'assistant',
          content: `**${getGreeting()}, OPERATOR.**\n\nSafi online. Ask anything — risk windows, routes, emergency contacts, or load-shedding impact for ${userContext.suburb}.`,
          timestamp: new Date(),
        },
      ]);
    }
  }, [isOpen, messages.length]);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  useEffect(() => {
    scrollEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, streaming]);

  const speak = useCallback(
    (text: string) => {
      if (!ttsSupported || !safiVoiceReplies) return;
      try {
        const cleaned = text.replace(/[*#`>_~\-•✦✓⚠💜⚡🌙🏃🧭🛡🌐]/g, '').replace(/\n+/g, '. ').trim();
        const utter = new SpeechSynthesisUtterance(cleaned);
        utter.lang = 'en-ZA';
        utter.rate = 1.05;
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utter);
      } catch {
        /* fail silently */
      }
    },
    [ttsSupported, safiVoiceReplies],
  );

  // ── STREAMING ──
  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || streaming) return;

      const userMsg: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: trimmed,
        timestamp: new Date(),
      };

      // Build payload BEFORE appending so we don't include the in-progress assistant
      const apiHistory = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      setMessages((prev) => [...prev, userMsg]);
      setInputValue('');
      setStreaming(true);

      const assistantId = (Date.now() + 1).toString();
      let assistantSoFar = '';
      let firstTokenSeen = false;

      const upsertAssistant = (chunk: string) => {
        assistantSoFar += chunk;
        setMessages((prev) => {
          if (!firstTokenSeen) {
            firstTokenSeen = true;
            return [
              ...prev,
              {
                id: assistantId,
                role: 'assistant',
                content: assistantSoFar,
                timestamp: new Date(),
              },
            ];
          }
          return prev.map((m) =>
            m.id === assistantId ? { ...m, content: assistantSoFar } : m,
          );
        });
      };

      const ctrl = new AbortController();
      abortRef.current = ctrl;

      try {
        const resp = await fetch(STREAM_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${PUBLIC_KEY}`,
          },
          signal: ctrl.signal,
          body: JSON.stringify({
            messages: apiHistory,
            context: {
              ...userContext,
              localTime: new Date().toLocaleString('en-ZA'),
            },
          }),
        });

        if (resp.status === 429) {
          toast({
            title: 'RATE LIMITED',
            description: 'Too many requests. Try again in a moment.',
            variant: 'destructive',
          });
          throw new Error('rate-limit');
        }
        if (resp.status === 402) {
          toast({
            title: 'CREDITS EXHAUSTED',
            description: 'Add Lovable AI credits in Settings → Workspace → Usage.',
            variant: 'destructive',
          });
          throw new Error('payment-required');
        }
        if (!resp.ok || !resp.body) throw new Error(`Bad response ${resp.status}`);

        const reader = resp.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let done = false;

        while (!done) {
          const { value, done: streamDone } = await reader.read();
          if (streamDone) break;
          buffer += decoder.decode(value, { stream: true });

          let nl: number;
          while ((nl = buffer.indexOf('\n')) !== -1) {
            let line = buffer.slice(0, nl);
            buffer = buffer.slice(nl + 1);
            if (line.endsWith('\r')) line = line.slice(0, -1);
            if (line.startsWith(':') || line.trim() === '') continue;
            if (!line.startsWith('data: ')) continue;
            const json = line.slice(6).trim();
            if (json === '[DONE]') {
              done = true;
              break;
            }
            try {
              const parsed = JSON.parse(json);
              const content = parsed.choices?.[0]?.delta?.content as string | undefined;
              if (content) upsertAssistant(content);
            } catch {
              buffer = line + '\n' + buffer;
              break;
            }
          }
        }

        if (assistantSoFar) speak(assistantSoFar);
      } catch (e: any) {
        if (e.name !== 'AbortError' && e.message !== 'rate-limit' && e.message !== 'payment-required') {
          console.error('Safi stream error:', e);
          if (!firstTokenSeen) {
            setMessages((prev) => [
              ...prev,
              {
                id: assistantId,
                role: 'assistant',
                content: '⚠ **CONNECTION FAILED.** Safi could not reach the gateway. Try again in a moment.',
                timestamp: new Date(),
              },
            ]);
          }
        }
      } finally {
        abortRef.current = null;
        setStreaming(false);
      }
    },
    [messages, streaming, speak, toast],
  );

  const cancelStream = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setStreaming(false);
  }, []);

  // ── VOICE INPUT ──
  const startVoiceInput = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    try {
      const recognition = new SR();
      recognition.lang = 'en-ZA';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setIsListening(false);
        sendMessage(transcript);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognition.start();
      recognitionRef.current = recognition;
    } catch {
      setIsListening(false);
    }
  }, [sendMessage]);

  const stopVoiceInput = useCallback(() => {
    recognitionRef.current?.stop?.();
    setIsListening(false);
  }, []);

  // ── HOTWORD ──
  useEffect(() => {
    if (!safiHotwordEnabled || !voiceSupported || isListening) {
      hotwordRef.current?.stop?.();
      hotwordRef.current = null;
      setHotwordActive(false);
      return;
    }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    let stopped = false;
    try {
      const rec = new SR();
      rec.lang = 'en-ZA';
      rec.continuous = true;
      rec.interimResults = true;
      rec.onstart = () => setHotwordActive(true);
      rec.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((r: any) => r[0]?.transcript ?? '')
          .join(' ')
          .toLowerCase();
        if (/\b(hey|hi|hello)\s+(safi|sa fi|sufi)\b/.test(transcript)) {
          rec.stop();
          setTimeout(() => startVoiceInput(), 250);
        }
      };
      rec.onerror = () => {
        if (!stopped) setTimeout(() => { try { rec.start(); } catch {} }, 1500);
      };
      rec.onend = () => {
        if (!stopped && safiHotwordEnabled) { try { rec.start(); } catch {} }
      };
      rec.start();
      hotwordRef.current = rec;
    } catch {
      setHotwordActive(false);
    }
    return () => {
      stopped = true;
      try { hotwordRef.current?.stop?.(); } catch {}
      setHotwordActive(false);
    };
  }, [safiHotwordEnabled, voiceSupported, isListening, startVoiceInput]);

  useEffect(() => {
    if (!isOpen && ttsSupported) window.speechSynthesis.cancel();
  }, [isOpen, ttsSupported]);

  if (!isOpen) return null;

  const modes = ['chat', 'briefing', 'route', 'emergency'] as const;

  return (
    <div
      className={cn(
        'fixed z-[96] bg-black flex flex-col text-white',
        isMobile ? 'inset-0' : 'top-0 right-0 bottom-0 w-[420px] border-l border-[#1A1A1A]',
      )}
    >
      {/* Scanline overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.025] z-0"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, #00FF85 0, #00FF85 1px, transparent 1px, transparent 4px)',
        }}
      />

      {/* TOP STATUS STRIP */}
      <header className="relative z-10 flex items-center justify-between px-4 py-3 border-b border-[#1A1A1A] shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <Sparkles className="w-3.5 h-3.5 shrink-0" style={{ color: '#00FF85' }} />
          <div
            className="text-xs font-bold tracking-[0.15em]"
            style={{ fontFamily: 'JetBrains Mono, monospace', color: '#00FF85' }}
          >
            SAFI
          </div>
          <span
            className="label-micro px-1.5 py-0.5 border"
            style={{ color: streaming ? '#FF9500' : '#00FF85', borderColor: streaming ? '#FF9500' : '#1A1A1A' }}
          >
            {streaming ? '◉ STREAMING' : '● ONLINE'}
          </span>
          {hotwordActive && (
            <span
              className="label-micro flex items-center gap-1 px-1.5 py-0.5 border animate-pulse"
              style={{ color: '#00B4D8', borderColor: '#00B4D8' }}
              title="Listening for 'Hey Safi'"
            >
              <Ear className="w-2.5 h-2.5" /> WAKE
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {voiceSupported && (
            <IconBtn
              active={safiHotwordEnabled}
              onClick={toggleSafiHotword}
              label={safiHotwordEnabled ? "Disable 'Hey Safi'" : "Enable 'Hey Safi'"}
            >
              <Ear className="w-3.5 h-3.5" />
            </IconBtn>
          )}
          {ttsSupported && (
            <IconBtn
              active={safiVoiceReplies}
              onClick={toggleSafiVoiceReplies}
              label={safiVoiceReplies ? 'Mute replies' : 'Read replies aloud'}
            >
              {safiVoiceReplies ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            </IconBtn>
          )}
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center border border-[#1A1A1A] hover:border-[#00FF85] hover:text-[#00FF85] text-[#666] transition-colors"
            aria-label="Close Safi"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* MODE TABS */}
      <div className="relative z-10 flex border-b border-[#1A1A1A] shrink-0">
        {modes.map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className="flex-1 py-2.5 text-[10px] font-bold tracking-[0.15em] uppercase transition-colors"
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              background: mode === m ? '#00FF85' : 'transparent',
              color: mode === m ? '#000' : '#666',
              borderRight: '1px solid #1A1A1A',
            }}
          >
            {m === 'chat' ? '◆ CHAT' : m === 'briefing' ? 'BRIEF' : m === 'route' ? 'ROUTE' : 'SOS'}
          </button>
        ))}
      </div>

      {/* CONTENT BY MODE */}
      {mode === 'emergency' ? (
        <EmergencyMode />
      ) : mode === 'briefing' ? (
        <BriefingMode />
      ) : mode === 'route' ? (
        <RouteMode onNavigate={onNavigate} />
      ) : (
        <>
          {/* CHAT TRANSCRIPT */}
          <ScrollArea className="flex-1 relative z-10">
            <div className="p-4 space-y-4">
              {messages.map((msg) => (
                <MessageRow key={msg.id} message={msg} />
              ))}
              {streaming && messages[messages.length - 1]?.role !== 'assistant' && (
                <div className="flex items-center gap-2 label-micro" style={{ color: '#00FF85' }}>
                  <span className="inline-block w-1.5 h-1.5 bg-[#00FF85] animate-pulse" />
                  PROCESSING…
                </div>
              )}
              <div ref={scrollEndRef} />
            </div>
          </ScrollArea>

          {/* QUICK PROMPTS */}
          {messages.length <= 1 && !streaming && (
            <div className="relative z-10 px-4 pb-2 flex gap-1.5 overflow-x-auto shrink-0">
              {QUICK_PROMPTS.map((chip) => (
                <button
                  key={chip}
                  onClick={() => sendMessage(chip)}
                  className="shrink-0 px-3 py-2 border border-[#1A1A1A] text-[11px] text-[#999] hover:text-[#00FF85] hover:border-[#00FF85] transition-colors"
                  style={{ fontFamily: 'JetBrains Mono, monospace' }}
                >
                  {chip}
                </button>
              ))}
            </div>
          )}

          {/* LISTENING BAR */}
          {isListening && (
            <div className="relative z-10 px-4 py-3 border-t border-[#1A1A1A] bg-[#00FF85]/5 flex flex-col items-center gap-1.5 shrink-0 animate-fade-in">
              <div className="flex items-end gap-1 h-5">
                {[0, 1, 2, 3].map((i) => (
                  <span
                    key={i}
                    className="w-1 bg-[#00FF85] animate-pulse"
                    style={{ height: `${40 + i * 15}%`, animationDelay: `${i * 100}ms` }}
                  />
                ))}
              </div>
              <span
                className="text-[10px] font-bold tracking-wider"
                style={{ fontFamily: 'JetBrains Mono, monospace', color: '#00FF85' }}
              >
                LISTENING · SPEAK NOW
              </span>
            </div>
          )}

          {/* INPUT */}
          <div
            className="relative z-10 flex items-center gap-2 p-3 border-t border-[#1A1A1A] shrink-0"
            style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
          >
            <div className="flex-1 flex items-center gap-2 border border-[#1A1A1A] focus-within:border-[#00FF85] bg-[#0A0A0A] px-3 transition-colors">
              <span
                className="label-micro shrink-0"
                style={{ color: '#00FF85' }}
              >
                {'>'}
              </span>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage(inputValue)}
                placeholder={isListening ? 'LISTENING…' : 'QUERY SAFI…'}
                disabled={streaming}
                className="flex-1 bg-transparent text-sm py-3 outline-none placeholder:text-[#444] disabled:opacity-50"
                style={{ fontFamily: 'JetBrains Mono, monospace', color: '#fff' }}
              />
              {voiceSupported && (
                <button
                  onClick={isListening ? stopVoiceInput : startVoiceInput}
                  disabled={streaming}
                  className="shrink-0 w-8 h-8 flex items-center justify-center border border-[#1A1A1A] hover:border-[#00FF85] transition-colors disabled:opacity-30"
                  style={{ color: isListening ? '#00FF85' : '#666' }}
                  aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
                >
                  {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                </button>
              )}
            </div>
            {streaming ? (
              <button
                onClick={cancelStream}
                className="w-12 h-12 flex items-center justify-center bg-[#FF3B30] hover:brightness-110 transition-all"
                aria-label="Cancel stream"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            ) : (
              <button
                onClick={() => sendMessage(inputValue)}
                disabled={!inputValue.trim()}
                className="w-12 h-12 flex items-center justify-center bg-[#00FF85] hover:brightness-110 active:scale-95 transition-all disabled:bg-[#1A1A1A] disabled:cursor-not-allowed"
                aria-label="Send message"
              >
                <Send className="w-4 h-4 text-black" />
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
});

SafiAI.displayName = 'SafiAI';
export default SafiAI;

// ─────────────────────────────────────────────
// SUBCOMPONENTS
// ─────────────────────────────────────────────

function IconBtn({
  active,
  onClick,
  label,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className="w-9 h-9 flex items-center justify-center border transition-colors"
      style={{
        borderColor: active ? '#00FF85' : '#1A1A1A',
        color: active ? '#00FF85' : '#666',
        background: active ? 'rgba(0,255,133,0.08)' : 'transparent',
      }}
    >
      {children}
    </button>
  );
}

function MessageRow({ message }: { message: Message }) {
  const isUser = message.role === 'user';
  return (
    <div className={cn('flex flex-col gap-1', isUser ? 'items-end' : 'items-start')}>
      <div
        className="flex items-center gap-2 label-micro"
        style={{ color: isUser ? '#666' : '#00FF85' }}
      >
        <span>{isUser ? '› YOU' : '◆ SAFI'}</span>
        <span style={{ color: '#444' }}>{fmtTime(message.timestamp)}</span>
      </div>
      <div
        className={cn('max-w-[88%] px-3 py-2.5 border')}
        style={{
          background: isUser ? 'rgba(0,255,133,0.05)' : '#0A0A0A',
          borderColor: isUser ? '#00FF85' : '#1A1A1A',
          borderLeft: isUser ? '2px solid #00FF85' : '2px solid #00FF85',
        }}
      >
        {isUser ? (
          <p
            className="text-sm whitespace-pre-wrap leading-relaxed"
            style={{ fontFamily: 'JetBrains Mono, monospace', color: '#fff' }}
          >
            {message.content}
          </p>
        ) : (
          <div className="safi-md text-sm leading-relaxed text-white">
            <ReactMarkdown
              components={{
                p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                strong: ({ children }) => (
                  <strong style={{ color: '#00FF85', fontWeight: 700 }}>{children}</strong>
                ),
                ul: ({ children }) => <ul className="my-2 space-y-1">{children}</ul>,
                ol: ({ children }) => <ol className="my-2 space-y-1 list-decimal pl-4">{children}</ol>,
                li: ({ children }) => (
                  <li className="flex gap-2">
                    <span style={{ color: '#00FF85' }}>›</span>
                    <span className="flex-1">{children}</span>
                  </li>
                ),
                code: ({ children }) => (
                  <code
                    className="px-1.5 py-0.5 text-xs"
                    style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      background: '#000',
                      color: '#00FF85',
                      border: '1px solid #1A1A1A',
                    }}
                  >
                    {children}
                  </code>
                ),
                a: ({ href, children }) => (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                    style={{ color: '#00B4D8' }}
                  >
                    {children}
                  </a>
                ),
              }}
            >
              {message.content || '…'}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}

function EmergencyMode() {
  const items = [
    { label: 'CALL SAPS', sub: '10111', tel: '10111', color: '#00B4D8', icon: Shield },
    { label: 'EMS AMBULANCE', sub: '10177', tel: '10177', color: '#FF3B30', icon: AlertTriangle },
    { label: 'SHARE LOCATION', sub: 'BROADCAST GUARDIANS', color: '#00FF85', icon: MapPin },
    { label: 'ALERT NETWORK', sub: 'NOTIFY ALL CONTACTS', color: '#FFD60A', icon: Users },
  ];
  return (
    <div className="relative z-10 flex-1 flex flex-col gap-3 p-4 overflow-y-auto">
      <div
        className="border p-3"
        style={{ borderColor: '#FF3B30', background: 'rgba(255,59,48,0.05)', borderLeft: '2px solid #FF3B30' }}
      >
        <div className="flex items-center gap-2 label-micro" style={{ color: '#FF3B30' }}>
          <AlertTriangle className="w-3 h-3" /> [ EMERGENCY MODE ARMED ]
        </div>
        <p className="text-xs text-white mt-1.5 leading-relaxed">
          Tap a contact to dial directly. Hold the SOS button on the home screen to broadcast to all guardians simultaneously.
        </p>
      </div>
      {items.map((item) => {
        const Inner = (
          <div className="flex items-center gap-3 px-4 py-3.5 border w-full bg-[#0A0A0A] hover:bg-[#111] transition-colors text-left"
               style={{ borderColor: '#1A1A1A', borderLeft: `2px solid ${item.color}` }}>
            <item.icon className="w-5 h-5 shrink-0" style={{ color: item.color }} />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold tracking-wider" style={{ fontFamily: 'JetBrains Mono, monospace', color: '#fff' }}>
                {item.label}
              </div>
              <div className="label-micro mt-0.5" style={{ color: '#666' }}>
                {item.sub}
              </div>
            </div>
            <ChevronRight className="w-4 h-4" style={{ color: item.color }} />
          </div>
        );
        return item.tel ? (
          <a key={item.label} href={`tel:${item.tel}`}>{Inner}</a>
        ) : (
          <button key={item.label} className="block w-full">{Inner}</button>
        );
      })}
    </div>
  );
}

function BriefingMode() {
  const day = new Date().toLocaleDateString('en-ZA', { weekday: 'long' }).toUpperCase();
  const items = [
    {
      level: 'THREAT',
      color: '#FF3B30',
      label: 'TOP THREAT',
      text: '3 vehicle break-ins overnight on Beach Road. Highest in 7 days.',
    },
    {
      level: 'WARN',
      color: '#FF9500',
      label: 'RISK WINDOW',
      text: 'Elevated risk 17:00–20:00 during Stage 2 load-shedding.',
    },
    {
      level: 'SAFE',
      color: '#00FF85',
      label: 'SAFE WINDOWS',
      text: 'Morning walk safe until 08:15. Evening return before 17:30.',
    },
    {
      level: 'INTEL',
      color: '#00B4D8',
      label: 'CPF PATROL',
      text: '2 stewards active on High Level Rd from 20:00 to 23:30.',
    },
  ];

  return (
    <div className="relative z-10 flex-1 overflow-y-auto p-4 space-y-3">
      <div>
        <div className="label-micro" style={{ color: '#666' }}>
          [ INTELLIGENCE BRIEFING · {day} ]
        </div>
        <h2
          className="text-xl font-bold mt-1"
          style={{ fontFamily: 'Space Grotesk, sans-serif' }}
        >
          {userContext.suburb.toUpperCase()}
        </h2>
      </div>
      {items.map((it) => (
        <div
          key={it.label}
          className="border bg-[#0A0A0A] p-3"
          style={{ borderColor: '#1A1A1A', borderLeft: `2px solid ${it.color}` }}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span
              className="label-micro"
              style={{ color: it.color }}
            >
              [ {it.label} ]
            </span>
            <span
              className="label-micro px-1.5 py-0.5 border"
              style={{ color: it.color, borderColor: it.color }}
            >
              {it.level}
            </span>
          </div>
          <p className="text-sm text-white leading-relaxed">{it.text}</p>
        </div>
      ))}
    </div>
  );
}

function RouteMode({ onNavigate }: { onNavigate?: (view: ViewId) => void }) {
  const routes = [
    { name: 'M3 VIA UCT', score: 7.8, color: '#00FF85', meta: 'ETA 18 MIN · LIT · CCTV' },
    { name: 'N2 HIGHWAY', score: 6.2, color: '#FF9500', meta: 'ETA 14 MIN · 1 ALERT' },
    { name: 'DE WAAL DRIVE', score: 4.1, color: '#FF3B30', meta: 'ETA 16 MIN · 2 INCIDENTS' },
  ];
  return (
    <div className="relative z-10 flex-1 overflow-y-auto p-4 space-y-3">
      <div>
        <div className="label-micro" style={{ color: '#666' }}>
          [ CORRIDOR ANALYSIS ]
        </div>
        <h2
          className="text-xl font-bold mt-1"
          style={{ fontFamily: 'Space Grotesk, sans-serif' }}
        >
          ROUTE SHIELD
        </h2>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="border border-[#1A1A1A] bg-[#0A0A0A] p-3">
          <div className="label-micro" style={{ color: '#666' }}>FROM</div>
          <div className="text-sm font-bold mt-1" style={{ fontFamily: 'JetBrains Mono, monospace', color: '#00FF85' }}>
            {userContext.suburb.toUpperCase()}
          </div>
        </div>
        <div className="border border-[#1A1A1A] bg-[#0A0A0A] p-3">
          <div className="label-micro" style={{ color: '#666' }}>TO</div>
          <div className="text-sm font-bold mt-1" style={{ fontFamily: 'JetBrains Mono, monospace', color: '#00FF85' }}>
            {userContext.commute.toUpperCase()}
          </div>
        </div>
      </div>

      {routes.map((r, i) => (
        <button
          key={r.name}
          className="w-full text-left border bg-[#0A0A0A] p-3 hover:bg-[#111] transition-colors"
          style={{ borderColor: '#1A1A1A', borderLeft: `2px solid ${r.color}` }}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="label-micro" style={{ color: '#666' }}>OPTION {String(i + 1).padStart(2, '0')}</div>
              <div className="text-sm font-bold mt-0.5" style={{ fontFamily: 'JetBrains Mono, monospace', color: '#fff' }}>
                {r.name}
              </div>
            </div>
            <div
              className="text-2xl font-bold"
              style={{ fontFamily: 'JetBrains Mono, monospace', color: r.color }}
            >
              {r.score.toFixed(1)}
            </div>
          </div>
          <div className="label-micro mt-2" style={{ color: '#666' }}>{r.meta}</div>
        </button>
      ))}

      <button
        onClick={() => onNavigate?.('safe-route')}
        className="btn-primary w-full mt-2 flex items-center justify-center gap-2"
      >
        OPEN ROUTE PLANNER <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
