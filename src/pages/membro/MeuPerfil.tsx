import { useEffect, useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { MemberLayout } from "@/components/membro/MemberLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useFullProfile } from "@/hooks/useFullProfile";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export default function MeuPerfil() {
  const { user } = useAuth();
  const { data: profile, isLoading } = useFullProfile();
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [showAvatar, setShowAvatar] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name ?? "");
      setLastName(profile.last_name ?? "");
      setPhone(profile.phone ?? "");
      setShowAvatar(profile.show_avatar_in_ranking);
    }
  }, [profile]);

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
    setUploading(false);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        first_name: firstName,
        last_name: lastName,
        phone,
        show_avatar_in_ranking: showAvatar,
      })
      .eq("id", user.id);
    if (error) toast.error("Erro ao salvar");
    else {
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

  if (isLoading) return <MemberLayout title="Meu Perfil"><div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div></MemberLayout>;

  const initials = `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();

  return (
    <MemberLayout title="Meu Perfil">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Foto de perfil</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row items-center gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={profile?.avatar_url ?? undefined} />
              <AvatarFallback className="text-2xl">{initials || "?"}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-3 w-full sm:w-auto">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? <Loader2 className="animate-spin" /> : <Camera />}
                Alterar foto
              </Button>
              <div className="flex items-center gap-3">
                <Switch
                  id="show-avatar"
                  checked={showAvatar}
                  onCheckedChange={setShowAvatar}
                />
                <Label htmlFor="show-avatar">Exibir foto no ranking</Label>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dados pessoais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Nome</Label>
                <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              </div>
              <div>
                <Label>Sobrenome</Label>
                <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
              </div>
            </div>
            <div>
              <Label>Email</Label>
              <Input value={profile?.email ?? ""} disabled />
            </div>
            <div>
              <Label>Telefone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Igreja</Label>
                <Input value={profile?.church_name ?? "—"} disabled />
              </div>
              <div>
                <Label>Área</Label>
                <Input value={profile?.area ? `Área ${profile.area}` : "—"} disabled />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="animate-spin" />}
                Salvar alterações
              </Button>
              <Button variant="outline" onClick={handleChangePassword}>
                Alterar senha
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </MemberLayout>
  );
}
