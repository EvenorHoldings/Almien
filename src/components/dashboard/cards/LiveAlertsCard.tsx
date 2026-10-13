import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Bell, AlertTriangle, Zap, Flame, ShieldAlert } from 'lucide-react';
import DemoBadge from '@/components/DemoBadge';

const mockAlerts = [
  { id: 1, text: 'Stage 4 loadshedding active — Nyanga, Mfuleni, Delft affected', severity: 'high', icon: 'zap', time: '2 min ago' },
  { id: 2, text: 'Armed robbery reported near Cape Town Station', severity: 'critical', icon: 'alert', time: '8 min ago' },
  { id: 3, text: 'Wildfire warning — Tokai/Constantia mountain slopes', severity: 'critical', icon: 'fire', time: '15 min ago' },
  { id: 4, text: 'Traffic accident N2 inbound — expect 30min delays', severity: 'medium', icon: 'shield', time: '22 min ago' },
  { id: 5, text: 'Water disruption — Camps Bay area until 18:00', severity: 'medium', icon: 'alert', time: '45 min ago' },
  { id: 6, text: 'SAPS increased patrols — Sea Point Promenade', severity: 'low', icon: 'shield', time: '1h ago' },
];

const severityColors: Record<string, string> = {
  critical: 'text-destructive border-destructive/30 bg-destructive/10',
  high: 'text-safety-orange border-safety-orange/30 bg-safety-orange/10',
  medium: 'text-safety-yellow border-safety-yellow/30 bg-safety-yellow/10',
  low: 'text-primary border-primary/30 bg-primary/10',
};

const iconMap: Record<string, React.ReactNode> = {
  zap: <Zap className="w-3 h-3" />,
  alert: <AlertTriangle className="w-3 h-3" />,
  fire: <Flame className="w-3 h-3" />,
  shield: <ShieldAlert className="w-3 h-3" />,
};

const LiveAlertsCard = () => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [tickerIndex, setTickerIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTickerIndex(prev => (prev + 1) % mockAlerts.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleToggle = (checked: boolean) => {
    setNotificationsEnabled(checked);
    if (checked && 'Notification' in window) {
      Notification.requestPermission();
    }
  };

  const current = mockAlerts[tickerIndex];

  return (
    <Card className="bg-card/80 backdrop-blur-sm border-border/50 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
      <CardHeader className="pb-2 px-4 pt-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Bell className="w-4 h-4 text-safety-yellow" />
            Live Safety Alerts
           <DemoBadge className="ml-2 align-middle" /></CardTitle>
          <Badge variant="outline" className="text-primary border-primary/30 text-[9px]">
            <span className="relative flex h-1.5 w-1.5 mr-1">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary" />
            </span>
            LIVE
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-3">
        {/* Ticker */}
        <div className={`p-2.5 rounded-lg border transition-all duration-500 ${severityColors[current.severity]}`}>
          <div className="flex items-start gap-2">
            <span className="mt-0.5 shrink-0">{iconMap[current.icon]}</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium leading-snug">{current.text}</p>
              <span className="text-[10px] opacity-70 mt-0.5 block">{current.time}</span>
            </div>
          </div>
        </div>

        {/* Recent list */}
        <div className="space-y-1.5">
          {mockAlerts.slice(0, 4).map(a => (
            <div key={a.id} className="flex items-center gap-2 px-2 py-1.5 rounded border border-border/30 bg-card/30">
              <span className={severityColors[a.severity].split(' ')[0]}>{iconMap[a.icon]}</span>
              <span className="text-[11px] text-foreground truncate flex-1">{a.text}</span>
              <span className="text-[9px] text-muted-foreground shrink-0">{a.time}</span>
            </div>
          ))}
        </div>

        {/* Notification toggle */}
        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <span className="text-[11px] text-muted-foreground">Browser Notifications</span>
          <Switch checked={notificationsEnabled} onCheckedChange={handleToggle} />
        </div>

        <div className="pt-1">
          <span className="text-[10px] text-muted-foreground/70">Western Cape Safety Intelligence • Real-time where available • Verified data only</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default LiveAlertsCard;
