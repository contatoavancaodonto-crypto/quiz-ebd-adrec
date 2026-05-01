import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export interface EditableMember {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  area: number | null;
  church_id?: string | null;
}

interface ChurchOpt {
  id: string;
  name: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: EditableMember | null;
  /** Se true, permite trocar a igreja (somente superadmin) */
  allowChurchEdit?: boolean;
  onSaved?: () => void;
}

export function EditMemberDialog({
  open,
  onOpenChange,
  member,
  allowChurchEdit = false,
  onSaved,
}: Props) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [area, setArea] = useState<string>("");
  const [churchId, setChurchId] = useState<string>("");
  const [churches, setChurches] = useState<ChurchOpt[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!member) return;
    setFirstName(member.first_name ?? "");
    setLastName(member.last_name ?? "");
    setEmail(member.email ?? "");
    setPhone(member.phone ?? "");
    setArea(member.area ? String(member.area) : "");
    setChurchId(member.church_id ?? "");
  }, [member]);

  useEffect(() => {
    if (!open || !allowChurchEdit) return;
    supabase
      .from("churches")
      .select("id, name")
      .eq("active", true)
      .order("name")
      .then(({ data }) => setChurches(data ?? []));
  }, [open, allowChurchEdit]);

  const handleSave = async () => {
    if (!member) return;
    if (!firstName.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }
    let areaNum: number | null = null;
    if (area.trim()) {
      const n = Number(area);
      if (!Number.isInteger(n) || n < 1 || n > 12) {
        toast.error("Área deve ser um número de 1 a 12");
        return;
      }
      areaNum = n;
    }

    setSaving(true);
    const newValues: Record<string, any> = {
      first_name: firstName.trim(),
      last_name: lastName.trim() || null,
      email: email.trim() || null,
      phone: phone.trim() || null,
      area: areaNum,
      display_name: `${firstName.trim()} ${lastName.trim()}`.trim(),
    };
    if (allowChurchEdit) {
      newValues.church_id = churchId || null;
    }

    // Snapshot dos valores antigos para auditoria
    const oldValues: Record<string, any> = {
      first_name: member.first_name,
      last_name: member.last_name,
      email: member.email,
      phone: member.phone,
      area: member.area,
    };
    if (allowChurchEdit) {
      oldValues.church_id = member.church_id ?? null;
    }

    const { error } = await (supabase as any)
      .from("profiles")
      .update(newValues)
      .eq("id", member.id);

    if (error) {
      setSaving(false);
      toast.error("Falha ao salvar: " + error.message);
      return;
    }

    // Calcula diff (apenas campos que mudaram)
    const changes: Record<string, { from: any; to: any }> = {};
    for (const key of Object.keys(oldValues)) {
      const before = oldValues[key] ?? null;
      const after = newValues[key] ?? null;
      if (before !== after) {
        changes[key] = { from: before, to: after };
      }
    }

    if (Object.keys(changes).length > 0) {
      try {
        const { data: authData } = await supabase.auth.getUser();
        const editorId = authData.user?.id;
        let editorName: string | null = null;
        let editorRole: string | null = null;
        if (editorId) {
          const [{ data: editorProfile }, { data: editorRoles }] = await Promise.all([
            supabase
              .from("profiles")
              .select("first_name, last_name, display_name")
              .eq("id", editorId)
              .maybeSingle(),
            supabase.from("user_roles").select("role").eq("user_id", editorId),
          ]);
          editorName =
            (editorProfile as any)?.display_name ||
            `${(editorProfile as any)?.first_name ?? ""} ${(editorProfile as any)?.last_name ?? ""}`.trim() ||
            null;
          const roles = (editorRoles ?? []).map((r: any) => r.role);
          editorRole = roles.includes("superadmin")
            ? "superadmin"
            : roles.includes("admin")
            ? "admin"
            : null;
        }
        await (supabase as any).from("profile_edit_audit").insert({
          profile_id: member.id,
          edited_by: editorId,
          editor_name: editorName,
          editor_role: editorRole,
          changes,
        });
      } catch (e) {
        // Auditoria não deve bloquear a edição
        console.warn("Falha ao registrar auditoria:", e);
      }
    }

    setSaving(false);
    toast.success("Dados atualizados com sucesso");
    onOpenChange(false);
    onSaved?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar membro</DialogTitle>
          <DialogDescription>
            Atualize os dados cadastrais do membro.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="first_name">Nome *</Label>
              <Input
                id="first_name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="last_name">Sobrenome</Label>
              <Input
                id="last_name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="area">Área (1-12)</Label>
              <Input
                id="area"
                type="number"
                min={1}
                max={12}
                value={area}
                onChange={(e) => setArea(e.target.value)}
              />
            </div>
          </div>
          {allowChurchEdit && (
            <div>
              <Label>Igreja</Label>
              <Select value={churchId} onValueChange={setChurchId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma igreja" />
                </SelectTrigger>
                <SelectContent>
                  {churches.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
