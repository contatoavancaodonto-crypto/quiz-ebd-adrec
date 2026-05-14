import { useEffect, useRef, useState } from "react";
import { Camera, Loader2, KeyRound, LogOut, User as UserIcon, Building2, GraduationCap, Mail, Phone, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useState } from "react";
import { MemberLayout } from "@/components/membro/MemberLayout";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useFullProfile } from "@/hooks/useFullProfile";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { AccountTabs } from "@/components/membro/AccountTabs";


export default function MeuPerfil() {
  const { user, signOut } = useAuth();
  const { data: profile, isLoading } = useFullProfile();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [displayName, setDisplayName] = useState("");
  // Armazena apenas os 11 dígitos após o 55 (DDD + número)
  const [phoneLocal, setPhoneLocal] = useState("");
  const [showAvatar, setShowAvatar] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name ?? "");
      setLastName(profile.last_name ?? "");
      setDisplayName(
        profile.display_name ??
          `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim()
      );
      // Remove tudo que não é dígito e tira o "55" inicial se existir
      const digits = (profile.phone ?? "").replace(/\D/g, "");
      const local = digits.startsWith("55") ? digits.slice(2) : digits;
      setPhoneLocal(local.slice(0, 11));
      setShowAvatar(profile.show_avatar_in_ranking);
    }
  }, [profile]);

  // Formata os 11 dígitos locais como "(DD) 9XXXX-XXXX"
  const formatLocalPhone = (digits: string) => {
    const d = digits.replace(/\D/g, "").slice(0, 11);
    if (d.length === 0) return "";
    if (d.length <= 2) return `(${d}`;
    if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  };

  const handlePhoneChange = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    setPhoneLocal(digits);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("A foto precisa ter menos de 5MB");
      return;
    }
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar.${ext}`;
    const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (upErr) {
      toast.error("Erro ao enviar foto");
      setUploading(false);
      return;
    }
    const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
    const url = `${pub.publicUrl}?t=${Date.now()}`;
    await supabase.from("profiles").update({ avatar_url: url }).eq("id", user.id);
    qc.invalidateQueries({ queryKey: ["full-profile"] });
    toast.success("Foto atualizada!");
    setAvatarError(false);
    setUploading(false);
  };

  const handleSave = async () => {
    if (!user) return;
    if (phoneLocal.length > 0 && phoneLocal.length !== 11) {
      toast.error("Telefone inválido. Use o formato (DD) 9XXXX-XXXX");
      return;
    }
    const trimmedDisplay = displayName.trim();
    if (trimmedDisplay.length < 2) {
      toast.error("Nome de usuário muito curto (mínimo 2 caracteres)");
      return;
    }
    if (trimmedDisplay.length > 50) {
      toast.error("Nome de usuário muito longo (máximo 50 caracteres)");
      return;
    }
    setSaving(true);
    const fullPhone = phoneLocal.length === 11 ? `55${phoneLocal}` : "";
    const { error } = await supabase
      .from("profiles")
      .update({
        first_name: firstName,
        last_name: lastName,
        display_name: trimmedDisplay,
        phone: fullPhone,
        show_avatar_in_ranking: showAvatar,
      })
      .eq("id", user.id);
    if (error) {
      console.error("Erro ao salvar:", error);
      toast.error("Erro ao salvar");
    } else {
      toast.success("Perfil atualizado");
      qc.invalidateQueries({ queryKey: ["full-profile"] });
    }
    setSaving(false);
  };

  const handleChangePassword = async () => {
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

  if (isLoading)
    return (
      <MemberLayout title="Perfil" mobileHeader={{ variant: "full" }} contentPaddingMobile={false}>
        <div className="flex justify-center p-8">
          <Loader2 className="animate-spin text-primary" />
        </div>
      </MemberLayout>
    );

  const initials = `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();

  return (
    <MemberLayout
      title="Perfil"
      mobileHeader={{ variant: "full" }}
      contentPaddingMobile={false}
    >
      <div className="px-4 py-4 space-y-4 pb-4">
        <AccountTabs />

        {/* Hero perfil */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary to-secondary p-6 text-white"
        >
          <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
          <div className="relative flex items-center gap-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-white/15 backdrop-blur border-2 border-white/40 flex items-center justify-center text-2xl font-display font-extrabold overflow-hidden">
                {profile?.avatar_url && !avatarError ? (
                  <img 
                    src={profile.avatar_url} 
                    alt={firstName} 
                    className="w-full h-full object-cover" 
                    onError={() => setAvatarError(true)}
                  />
                ) : (
                  initials || <UserIcon className="w-8 h-8" />
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
              <button
                aria-label="Alterar foto"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-white text-primary flex items-center justify-center shadow-lg active:scale-95 transition-transform"
              >
                {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
              </button>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] uppercase tracking-widest opacity-80 font-bold">Bem-vindo</div>
              <h1 className="text-xl font-display font-extrabold leading-tight truncate">
                {displayName || `${firstName} ${lastName}`.trim() || "—"}
              </h1>
              <p className="text-xs opacity-85 truncate flex items-center gap-1 mt-0.5">
                <Mail className="w-3 h-3" /> {profile?.email}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Info imutável */}
        <section className="space-y-2">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold px-1">
            Sua igreja
          </div>
          <div className="rounded-2xl bg-card border border-border divide-y divide-border overflow-hidden">
            <InfoRow icon={Building2} label="Igreja" value={profile?.church_name ?? "—"} />
            <InfoRow icon={GraduationCap} label="Classe" value={profile?.class_name ?? "—"} />
          </div>
        </section>

        {/* Editáveis */}
        <section className="space-y-2">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold px-1">
            Dados pessoais
          </div>
          <div className="rounded-2xl bg-card border border-border p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Nome</Label>
                <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Sobrenome</Label>
                <Input value={lastName} onChange={(e) => setLastName(e.target.value)} className="mt-1" />
              </div>
            </div>
            <div>
              <Label className="text-xs flex items-center gap-1">
                <UserIcon className="w-3 h-3" /> Nome de usuário (aparece no ranking)
              </Label>
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={50}
                placeholder="Ex: João Silva"
                className="mt-1"
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                Use o nome que você quer que apareça no ranking e nas tentativas. Mínimo 2 caracteres.
              </p>
            </div>
            <div>
              <Label className="text-xs flex items-center gap-1">
                <Phone className="w-3 h-3" /> Telefone
              </Label>
              <div className="mt-1 flex items-stretch rounded-md border border-input bg-background overflow-hidden focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background">
                <span className="flex items-center px-3 text-sm bg-muted text-muted-foreground border-r border-input select-none">
                  +55
                </span>
                <Input
                  value={formatLocalPhone(phoneLocal)}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  inputMode="numeric"
                  placeholder="(DD) 9XXXX-XXXX"
                  maxLength={16}
                  className="border-0 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">
                Formato Brasil: +55 (DDD) 9XXXX-XXXX
              </p>
            </div>
            <Button onClick={handleSave} disabled={saving} className="w-full gradient-primary">
              {saving && <Loader2 className="animate-spin w-4 h-4 mr-2" />}
              Salvar alterações
            </Button>
          </div>
        </section>

        {/* Privacidade */}
        <section className="space-y-2">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold px-1">
            Privacidade
          </div>
          <div className="rounded-2xl bg-card border border-border p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Eye className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <Label className="font-semibold text-sm">Mostrar foto no ranking</Label>
              <p className="text-[11px] text-muted-foreground">Sua foto aparece ao lado do seu nome.</p>
            </div>
            <Switch checked={showAvatar} onCheckedChange={setShowAvatar} />
          </div>
        </section>

        {/* Conta */}
        <section className="space-y-2">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold px-1">
            Conta
          </div>
          <div className="rounded-2xl bg-card border border-border divide-y divide-border overflow-hidden">
            <ActionRow icon={KeyRound} label="Alterar senha" onClick={handleChangePassword} />
            <ActionRow icon={LogOut} label="Sair" onClick={handleLogout} destructive />
          </div>
        </section>
      </div>
    </MemberLayout>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="w-9 h-9 rounded-xl bg-muted text-muted-foreground flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">{label}</div>
        <div className="text-sm font-semibold text-foreground truncate">{value}</div>
      </div>
    </div>
  );
}

function ActionRow({
  icon: Icon,
  label,
  onClick,
  destructive,
}: {
  icon: any;
  label: string;
  onClick: () => void;
  destructive?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3.5 active:bg-muted/60 transition-colors text-left"
    >
      <div
        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
          destructive
            ? "bg-destructive/10 text-destructive"
            : "bg-primary/10 text-primary"
        }`}
      >
        <Icon className="w-4 h-4" />
      </div>
      <span className={`flex-1 text-sm font-semibold ${destructive ? "text-destructive" : "text-foreground"}`}>
        {label}
      </span>
    </button>
  );
}
