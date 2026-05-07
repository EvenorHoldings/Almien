import { useState, memo } from 'react';
import { Eye, X, Send, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const incidentTypes = [
  'Robbery', 'Hijacking', 'Assault', 'Suspicious Activity',
  'Drug Activity', 'Vandalism', 'Traffic Accident', 'Other',
];

const WitnessReportButton = memo(() => {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState('');
  const [description, setDescription] = useState('');
  const [anonymous, setAnonymous] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = () => {
    if (!type) {
      toast.error('Please select an incident type');
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setOpen(false);
      setType('');
      setDescription('');
      toast.success('Report submitted for moderation', {
        description: anonymous ? 'Your identity will remain anonymous.' : 'Thank you for your report.',
      });
    }, 1200);
  };

  return (
    <>
      {/* Floating eye icon */}
      <button
        onClick={() => { setOpen(true); try { navigator.vibrate?.([15]); } catch {} }}
        className={cn(
          "fixed z-[93] w-11 h-11 rounded-full right-4 md:right-6 md:bottom-6",
          "bg-card border border-border shadow-lg",
          "flex items-center justify-center",
          "hover:scale-105 transition-transform text-muted-foreground hover:text-foreground"
        )}
        style={{ bottom: 'calc(3.5rem + env(safe-area-inset-bottom, 0px) + 16px)' }}
        aria-label="Report an incident anonymously"
      >
        <Eye className="w-5 h-5" />
      </button>

      {/* Report form overlay */}
      {open && (
        <div className="fixed inset-0 z-[10000] bg-black/40 flex items-end sm:items-center justify-center animate-fade-in">
          <div className="w-full sm:max-w-md bg-card border border-border rounded-t-2xl sm:rounded-2xl p-6 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Eye className="w-5 h-5 text-primary" /> Witness Report
              </h3>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setOpen(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <Select value={type} onValueChange={setType}>
              <SelectTrigger><SelectValue placeholder="Incident type..." /></SelectTrigger>
              <SelectContent>
                {incidentTypes.map(t => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Textarea
              placeholder="Describe what you saw..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="min-h-[80px]"
            />

            <Button variant="outline" className="w-full justify-start text-muted-foreground" disabled>
              <Camera className="w-4 h-4 mr-2" /> Attach photo (coming soon)
            </Button>

            <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
              <span className="text-sm font-medium text-foreground">I want to remain anonymous</span>
              <Switch checked={anonymous} onCheckedChange={setAnonymous} />
            </div>

            <Button className="w-full" onClick={handleSubmit} disabled={submitting}>
              <Send className="w-4 h-4 mr-2" />
              {submitting ? 'Submitting...' : 'Submit Report'}
            </Button>

            <p className="text-[10px] text-muted-foreground text-center">
              Reports are reviewed by moderators before appearing on the map.
            </p>
          </div>
        </div>
      )}
    </>
  );
});

WitnessReportButton.displayName = 'WitnessReportButton';
export default WitnessReportButton;
