import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, KeyRound, Eye, Settings as SettingsIcon } from "lucide-react";
import { motion } from "framer-motion";
import { MemberLayout } from "@/components/membro/MemberLayout";
import { PageShell } from "@/components/ui/page-shell";
import { PageHero } from "@/components/ui/page-hero";
import { SectionLabel } from "@/components/ui/page-shell";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useFullProfile } from "@/hooks/useFullProfile";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export default function Configuracoes() {
  const { user, signOut } = useAuth();
  const { data: profile } = useFullProfile();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [showAvatar, setShowAvatar] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) setShowAvatar(profile.show_avatar_in_ranking);
  }, [profile]);

  const toggleAvatar = async (val: boolean) => {
    if (!user) return;
    setShowAvatar(val);
    setSaving(true);
    await supabase.from("profiles").update({ show_avatar_in_ranking: val }).eq("id", user.id);
    qc.invalidateQueries({ queryKey: ["full-profile"] });
    setSaving(false);
    toast.success("Preferência salva");
  };

  const handleResetPassword = async () => {
    if (!profile?.email) return;
    const { error } = await supabase.auth.resetPasswordForEmail(profile.email, {
      redirectTo: `${window.location.origin}/auth`,
    });
    if (error) toast.error("Erro ao enviar email");
    else toast.success("Email de redefinição enviado!");
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <MemberLayout
      title="Configurações"
      mobileHeader={{ variant: "back", title: "Configurações", backTo: "/membro/perfil" }}
    >
      <div className="space-y-4 pb-4">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl bg-gradient-to-br from-slate-700 to-slate-900 p-5 text-white relative overflow-hidden"
        >
          <div className="absolute -top-6 -right-6 opacity-20">
            <SettingsIcon className="w-28 h-28" strokeWidth={1.2} />
          </div>
          <div className="relative">
            <div className="text-[10px] uppercase tracking-widest font-bold opacity-80">Preferências</div>
            <h2 className="text-xl font-bold mt-1">Configurações da conta</h2>
          </div>
        </motion.div>

        <section className="space-y-2">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold px-1">
            Privacidade
          </div>
          <div className="rounded-2xl bg-card border border-border p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Eye className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <Label htmlFor="cfg-avatar" className="font-semibold text-sm">Exibir foto no ranking</Label>
              <p className="text-[11px] text-muted-foreground">Sua foto aparecerá ao lado do seu nome.</p>
            </div>
            <Switch
              id="cfg-avatar"
              checked={showAvatar}
              onCheckedChange={toggleAvatar}
              disabled={saving}
            />
          </div>
        </section>

        <section className="space-y-2">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold px-1">
            Conta
          </div>
          <div className="rounded-2xl bg-card border border-border divide-y divide-border overflow-hidden">
            <button
              onClick={handleResetPassword}
              className="w-full flex items-center gap-3 px-4 py-3.5 active:bg-muted/60 transition-colors text-left"
            >
              <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <KeyRound className="w-4 h-4" />
              </div>
              <span className="flex-1 text-sm font-semibold text-foreground">Alterar senha</span>
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3.5 active:bg-muted/60 transition-colors text-left"
            >
              <div className="w-9 h-9 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center shrink-0">
                <LogOut className="w-4 h-4" />
              </div>
              <span className="flex-1 text-sm font-semibold text-destructive">Sair</span>
            </button>
          </div>
        </section>
      </div>
    </MemberLayout>
  );
}
