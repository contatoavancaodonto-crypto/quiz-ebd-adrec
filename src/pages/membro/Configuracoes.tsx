import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, KeyRound, Loader2 } from "lucide-react";
import { MemberLayout } from "@/components/membro/MemberLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
    <MemberLayout title="Configurações">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Privacidade</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div>
              <Label htmlFor="cfg-avatar" className="font-medium">Exibir foto no ranking</Label>
              <p className="text-xs text-muted-foreground">Sua foto aparecerá ao lado do seu nome.</p>
            </div>
            <Switch
              id="cfg-avatar"
              checked={showAvatar}
              onCheckedChange={toggleAvatar}
              disabled={saving}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Conta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" onClick={handleResetPassword} className="w-full sm:w-auto">
              <KeyRound /> Alterar senha
            </Button>
            <Button variant="destructive" onClick={handleLogout} className="w-full sm:w-auto">
              <LogOut /> Sair
            </Button>
          </CardContent>
        </Card>
      </div>
    </MemberLayout>
  );
}
