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
    const update: Record<string, any> = {
      first_name: firstName.trim(),
      last_name: lastName.trim() || null,
      email: email.trim() || null,
      phone: phone.trim() || null,
      area: areaNum,
      display_name: `${firstName.trim()} ${lastName.trim()}`.trim(),
    };
    if (allowChurchEdit) {
      update.church_id = churchId || null;
    }

    const { error } = await supabase
      .from("profiles")
      .update(update)
      .eq("id", member.id);

    setSaving(false);
    if (error) {
      toast.error("Falha ao salvar: " + error.message);
      return;
    }
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
