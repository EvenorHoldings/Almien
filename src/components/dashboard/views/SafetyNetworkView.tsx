import { useState, memo } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserPlus, Trash2, Send, Shield, Users, Phone } from 'lucide-react';
import { toast } from 'sonner';
import type { ViewId } from '../AlmienDashboard';

interface TrustedContact {
  id: string;
  name: string;
  phone: string;
  role: 'primary' | 'armed-response' | 'steward';
}

const roleLabels: Record<TrustedContact['role'], string> = {
  primary: 'Primary Contact',
  'armed-response': 'Armed Response',
  steward: 'Community Steward',
};

const roleColors: Record<TrustedContact['role'], string> = {
  primary: 'bg-primary/10 text-primary border-primary/20',
  'armed-response': 'bg-destructive/10 text-destructive border-destructive/20',
  steward: 'bg-safety-yellow/20 text-foreground border-safety-yellow/30',
};

interface Props {
  onUpgrade: (trigger?: string) => void;
  onNavigate: (view: ViewId) => void;
}

const SafetyNetworkView = memo((_props: Props) => {
  const [contacts, setContacts] = useState<TrustedContact[]>([
    { id: '1', name: 'Mom', phone: '+27821234567', role: 'primary' },
    { id: '2', name: 'ADT Response', phone: '+27860100111', role: 'armed-response' },
  ]);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newRole, setNewRole] = useState<TrustedContact['role']>('primary');

  const addContact = () => {
    if (!newName.trim() || !newPhone.trim()) {
      toast.error('Name and phone number required');
      return;
    }
    if (contacts.length >= 5) {
      toast.error('Maximum 5 trusted contacts');
      return;
    }
    setContacts(prev => [...prev, {
      id: Date.now().toString(),
      name: newName.trim(),
      phone: newPhone.trim(),
      role: newRole,
    }]);
    setNewName('');
    setNewPhone('');
    toast.success(`${newName.trim()} added to your Safety Network`);
  };

  const removeContact = (id: string) => {
    setContacts(prev => prev.filter(c => c.id !== id));
    toast.success('Contact removed');
  };

  const sendTestAlert = () => {
    toast.success(`Test alert sent to ${contacts.length} contacts`, {
      description: 'All contacts would receive your GPS location and emergency message.',
      duration: 4000,
    });
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <Shield className="w-8 h-8 text-destructive" />
          My Safety Network
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage your trusted contacts for panic alerts. Up to 5 contacts.
        </p>
      </div>

      {/* Current contacts */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Users className="w-5 h-5" /> Trusted Contacts ({contacts.length}/5)
        </h2>
        {contacts.length === 0 ? (
          <div className="p-8 rounded-xl border border-border bg-card text-center">
            <Users className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No contacts yet. Add your first trusted contact below.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {contacts.map(c => (
              <div key={c.id} className="flex items-center justify-between p-4 rounded-xl border border-border bg-card">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-foreground font-bold text-sm">
                    {c.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{c.name}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Phone className="w-3 h-3" /> {c.phone}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn("text-[10px] font-bold px-2 py-1 rounded-full border", roleColors[c.role])}>
                    {roleLabels[c.role]}
                  </span>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10" onClick={() => removeContact(c.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add contact */}
      {contacts.length < 5 && (
        <div className="p-6 rounded-xl border border-border bg-card space-y-4">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <UserPlus className="w-4 h-4" /> Add Contact
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input placeholder="Name" value={newName} onChange={e => setNewName(e.target.value)} />
            <Input placeholder="+27..." value={newPhone} onChange={e => setNewPhone(e.target.value)} />
            <Select value={newRole} onValueChange={(v) => setNewRole(v as TrustedContact['role'])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="primary">Primary Contact</SelectItem>
                <SelectItem value="armed-response">Armed Response</SelectItem>
                <SelectItem value="steward">Community Steward</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={addContact} className="w-full sm:w-auto">
            <UserPlus className="w-4 h-4 mr-2" /> Add to Network
          </Button>
        </div>
      )}

      {/* Test alert */}
      <div className="p-6 rounded-xl border border-destructive/20 bg-destructive/5">
        <h3 className="text-sm font-bold text-foreground mb-2">Test Your Alert</h3>
        <p className="text-xs text-muted-foreground mb-4">
          Send a test notification to all your trusted contacts. They'll receive a message marked as "[TEST]".
        </p>
        <Button variant="destructive" onClick={sendTestAlert} disabled={contacts.length === 0}>
          <Send className="w-4 h-4 mr-2" /> Send Test Alert
        </Button>
      </div>
    </div>
  );
});

SafetyNetworkView.displayName = 'SafetyNetworkView';
export default SafetyNetworkView;
