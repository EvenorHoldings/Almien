import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Shield, ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useRoles } from "@/hooks/useRoles";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { toUserMessage } from "@/lib/errorMessages";

const schema = z.object({
  email: z.string().email("Invalid operator email"),
  password: z.string().min(8, "Min 8 characters"),
});

type FormValues = z.infer<typeof schema>;

export default function AuthPage() {
  const { user, signInWithPassword, signUpWithPassword, signOut } = useAuth();
  const { toast } = useToast();
  const nav = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from as string | undefined;

  const { data: profile } = useProfile(user?.id ?? null);
  const { data: roles } = useRoles(user?.id ?? null);

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [tick, setTick] = useState("");

  useEffect(() => {
    const update = () => {
      const d = new Date();
      setTick(
        `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(
          2,
          "0",
        )}:${String(d.getUTCSeconds()).padStart(2, "0")} UTC`,
      );
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  const postAuthTarget = useMemo(() => {
    if (from) return from;
    if ((roles ?? []).includes("dispatcher") || (roles ?? []).includes("admin")) return "/dispatch";
    if ((roles ?? []).includes("responder")) return "/responder";
    return "/dashboard";
  }, [from, roles]);

  // ── Signed-in state ──
  if (user) {
    const claimInitialAdmin = async () => {
      try {
        const { data: hasAdmin, error: e1 } = await supabase.rpc("any_admin_exists");
        if (e1) throw e1;
        if (hasAdmin) {
          toast({ title: "Admin already provisioned", description: "Request role escalation from active admin." });
          return;
        }
        const { data: claimed, error: e2 } = await supabase.rpc("claim_initial_admin");
        if (e2) throw e2;
        if (!claimed) {
          toast({ title: "Claim rejected", description: "Concurrent admin assignment detected." });
          return;
        }
        toast({ title: "ADMIN ROLE GRANTED", description: "Dispatch console unlocked." });
        nav("/dispatch");
      } catch (e) {
        toast({ title: "BOOTSTRAP FAILED", description: toUserMessage(e), variant: "destructive" });
      }
    };

    return (
      <main className="min-h-screen bg-black flex flex-col text-white">
        <TopBar tick={tick} onBack={() => nav("/")} />

        <div className="flex-1 flex items-center justify-center px-4 py-8">
          <div className="w-full max-w-md">
            <div
              className="border border-[#1A1A1A] bg-[#0A0A0A] p-6"
              style={{ borderLeft: "2px solid #7C3AED" }}
            >
              <div className="label-micro mb-2" style={{ color: "#7C3AED" }}>
                [ AUTHENTICATED SESSION ]
              </div>
              <div
                className="text-2xl font-bold mb-1"
                style={{ fontFamily: "Space Grotesk, sans-serif" }}
              >
                OPERATOR
              </div>
              <div className="mono text-xs text-[#666] truncate">{user.email}</div>

              <div className="mt-5 grid grid-cols-2 gap-2">
                <Spec label="DISPLAY" value={profile?.display_name ?? "—"} />
                <Spec
                  label="ROLES"
                  value={(roles ?? []).length ? (roles ?? []).join(",") : "NONE"}
                />
              </div>

              {(roles ?? []).length === 0 && (
                <div className="mt-5 border border-[#FF9500]/40 bg-[#FF9500]/5 p-3">
                  <div className="label-micro" style={{ color: "#FF9500" }}>
                    [ NO ROLES ASSIGNED ]
                  </div>
                  <p className="text-xs text-[#999] mt-1.5 leading-relaxed">
                    First operator on a fresh deployment may claim the initial Admin role.
                  </p>
                  <button onClick={claimInitialAdmin} className="btn-primary mt-3 w-full">
                    CLAIM ADMIN
                  </button>
                </div>
              )}

              <div className="mt-5 flex gap-2">
                <button onClick={() => nav(postAuthTarget)} className="btn-primary flex-1">
                  CONTINUE →
                </button>
                <button
                  onClick={() => signOut()}
                  className="px-4 py-3 border border-[#1A1A1A] text-xs font-bold tracking-wider uppercase text-[#999] hover:text-white hover:border-[#333] transition-colors"
                  style={{ fontFamily: "JetBrains Mono, monospace" }}
                >
                  SIGN OUT
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // ── Auth form ──
  const onSubmit = async (values: FormValues) => {
    try {
      if (mode === "signin") {
        await signInWithPassword(values.email, values.password);
        nav(postAuthTarget);
      } else {
        await signUpWithPassword(values.email, values.password);
        toast({
          title: "ACCOUNT PROVISIONED",
          description: "Authentication ready. Sign in to continue.",
        });
        setMode("signin");
      }
    } catch (e) {
      toast({
        title: "AUTHENTICATION FAILED",
        description: toUserMessage(e),
        variant: "destructive",
      });
    }
  };

  return (
    <main className="min-h-screen bg-black flex flex-col text-white">
      <TopBar tick={tick} onBack={() => nav("/")} />

      {/* Scanline overlay */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03] z-0"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, #7C3AED 0, #7C3AED 1px, transparent 1px, transparent 4px)",
        }}
      />

      <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {/* Header block */}
          <div className="mb-6">
            <div className="flex items-center gap-2 label-micro mb-2" style={{ color: "#7C3AED" }}>
              <Shield className="w-3 h-3" />
              [ STAFF ACCESS · RESTRICTED ]
            </div>
            <h1
              className="text-3xl font-bold tracking-tight"
              style={{ fontFamily: "Space Grotesk, sans-serif" }}
            >
              OPERATOR LOGIN
            </h1>
            <p className="text-xs text-[#666] mt-1.5 mono">
              Dispatch · Responder · Admin terminals
            </p>
          </div>

          {/* Mode toggle */}
          <div className="flex border border-[#1A1A1A] mb-5">
            {(["signin", "signup"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className="flex-1 py-2.5 text-xs font-bold tracking-wider uppercase transition-colors"
                style={{
                  fontFamily: "JetBrains Mono, monospace",
                  background: mode === m ? "#7C3AED" : "transparent",
                  color: mode === m ? "#000" : "#666",
                }}
              >
                {m === "signin" ? "SIGN IN" : "REGISTER"}
              </button>
            ))}
          </div>

          {/* Form card */}
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="border border-[#1A1A1A] bg-[#0A0A0A] p-5 space-y-5"
          >
            <div>
              <label className="label-micro block mb-2" style={{ color: "#666" }}>
                [ EMAIL ]
              </label>
              <input
                type="email"
                autoComplete="email"
                placeholder="operator@almien.live"
                className="t-input w-full"
                {...form.register("email")}
              />
              {form.formState.errors.email && (
                <p className="mt-1.5 text-xs mono" style={{ color: "#FF3B30" }}>
                  ⚠ {form.formState.errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label className="label-micro block mb-2" style={{ color: "#666" }}>
                [ PASSWORD ]
              </label>
              <input
                type="password"
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                placeholder="••••••••"
                className="t-input w-full"
                {...form.register("password")}
              />
              {form.formState.errors.password && (
                <p className="mt-1.5 text-xs mono" style={{ color: "#FF3B30" }}>
                  ⚠ {form.formState.errors.password.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={form.formState.isSubmitting}
              className="btn-primary w-full"
            >
              {form.formState.isSubmitting
                ? "AUTHENTICATING..."
                : mode === "signin"
                  ? "AUTHENTICATE →"
                  : "CREATE ACCOUNT →"}
            </button>
          </form>

          {/* Footer note */}
          <p
            className="mt-4 text-center label-micro"
            style={{ color: "#444" }}
          >
            CIVILIAN USERS · GO BACK TO ENTER TERMINAL
          </p>
        </div>
      </div>
    </main>
  );
}

// ── Subcomponents ──
function TopBar({ tick, onBack }: { tick: string; onBack: () => void }) {
  return (
    <header className="relative z-20 flex items-center justify-between px-4 py-3 border-b border-[#1A1A1A] bg-black">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 label-micro hover:text-[#7C3AED] transition-colors"
        style={{ color: "#666" }}
      >
        <ArrowLeft className="w-3 h-3" /> BACK
      </button>
      <div className="label-micro mono" style={{ color: "#666" }}>
        {tick}
      </div>
      <div className="label-micro" style={{ color: "#7C3AED" }}>
        AUTH
      </div>
    </header>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-[#1A1A1A] bg-black px-3 py-2">
      <div className="label-micro" style={{ color: "#666" }}>
        {label}
      </div>
      <div
        className="text-sm font-bold truncate mt-0.5"
        style={{ color: "#7C3AED", fontFamily: "JetBrains Mono, monospace" }}
      >
        {value}
      </div>
    </div>
  );
}
