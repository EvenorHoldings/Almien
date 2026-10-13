import { Link } from 'react-router-dom';
import { LogIn, LogOut, Radio, Siren } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRoles } from '@/hooks/useRoles';

/** Compact sign-in / sign-out control with role-gated console links. */
export default function AccountMenu() {
  const { user, signOut } = useAuth();
  const { data: roles } = useRoles(user?.id);
  const has = (r: string) => (roles ?? []).some((x) => x === r || x === 'admin');
  const pill = 'flex items-center gap-1 h-7 px-2 rounded-full bg-surface-02 border border-border-subtle text-[11px] font-semibold text-foreground hover:bg-secondary shrink-0';

  if (!user) {
    return (
      <Link to="/auth" className={pill} aria-label="Sign in">
        <LogIn className="w-3 h-3" /><span className="hidden sm:inline">Sign in</span>
      </Link>
    );
  }
  return (
    <>
      {has('dispatcher') && (
        <Link to="/dispatch" className={pill} aria-label="Dispatch console">
          <Radio className="w-3 h-3" /><span className="hidden lg:inline">Dispatch</span>
        </Link>
      )}
      {has('responder') && (
        <Link to="/responder" className={pill} aria-label="Responder console">
          <Siren className="w-3 h-3" /><span className="hidden lg:inline">Responder</span>
        </Link>
      )}
      <button type="button" onClick={() => { void signOut(); }} className={pill} aria-label="Sign out">
        <LogOut className="w-3 h-3" /><span className="hidden sm:inline">Sign out</span>
      </button>
    </>
  );
}
