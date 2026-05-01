import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Shield, ShieldOff, Search, Crown, EyeOff, Eye, Pencil } from "lucide-react";
import { EditMemberDialog, type EditableMember } from "@/components/admin/EditMemberDialog";
import { useRoles } from "@/hooks/useRoles";
import { Navigate } from "react-router-dom";
import { AdminPage } from "@/components/admin/AdminPage";
import { hideUserProfile, restoreUserProfile } from "@/lib/admin-delete";
import { DeleteButton } from "@/components/admin/DeleteButton";

interface ProfileRow {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  area: number | null;
  profile_church_id: string | null;
  role: "superadmin" | "admin" | null;
  role_church_id: string | null;
  hidden_at: string | null;
}

interface ChurchOpt {
  id: string;
  name: string;
}

export default function AdminUsers() {
  const { isSuperadmin, loading: rolesLoading } = useRoles();
  const [rows, setRows] = useState<ProfileRow[]>([]);
  const [churches, setChurches] = useState<ChurchOpt[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "none" | "admin" | "superadmin">("all");

  const [promoteOpen, setPromoteOpen] = useState(false);
  const [target, setTarget] = useState<ProfileRow | null>(null);
  const [newRole, setNewRole] = useState<"admin" | "superadmin">("admin");
  const [newChurchId, setNewChurchId] = useState<string>("");
  const [editTarget, setEditTarget] = useState<EditableMember | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    const [profilesRes, rolesRes, churchesRes] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, first_name, last_name, email, phone, area, church_id, hidden_at")
        .order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id, role, church_id"),
      supabase.from("churches").select("id, name").eq("active", true).order("name"),
    ]);
    const rolesByUser = new Map<string, { role: any; church_id: string | null }>();
    (rolesRes.data ?? []).forEach((r: any) => {
      // superadmin tem prioridade na exibição
      const existing = rolesByUser.get(r.user_id);
      if (!existing || r.role === "superadmin") {
        rolesByUser.set(r.user_id, { role: r.role, church_id: r.church_id });
      }
    });
    setRows(
      (profilesRes.data ?? []).map((p: any) => {
        const r = rolesByUser.get(p.id);
        return {
          id: p.id,
          first_name: p.first_name,
          last_name: p.last_name,
          email: p.email,
          phone: p.phone,
          profile_church_id: p.church_id,
          role: r?.role ?? null,
          role_church_id: r?.church_id ?? null,
          hidden_at: (p as any).hidden_at ?? null,
        };
      })
    );
    setChurches(churchesRes.data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const channel = supabase
      .channel("admin-users-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "user_roles" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "churches" }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (rolesLoading) return null;
  if (!isSuperadmin) return <Navigate to="/painel-ebd-2025" replace />;

  const openPromote = (row: ProfileRow) => {
    setTarget(row);
    setNewRole("admin");
    setNewChurchId(row.profile_church_id ?? "");
    setPromoteOpen(true);
  };

  const confirmPromote = async () => {
    if (!target) return;
    if (newRole === "admin" && !newChurchId) {
      toast.error("Selecione a igreja para o admin");
      return;
    }
    // remove papéis anteriores do usuário antes de gravar
    await supabase.from("user_roles").delete().eq("user_id", target.id);
    const { error } = await supabase.from("user_roles").insert({
      user_id: target.id,
      role: newRole,
      church_id: newRole === "superadmin" ? null : newChurchId,
    });
    if (error) return toast.error("Falha ao promover: " + error.message);
    toast.success(newRole === "superadmin" ? "Promovido a Superadmin" : "Promovido a Admin de Igreja");
    setPromoteOpen(false);
    setTarget(null);
    load();
  };

  const removeRole = async (row: ProfileRow) => {
    const { error } = await supabase.from("user_roles").delete().eq("user_id", row.id);
    if (error) return toast.error("Falha ao remover: " + error.message);
    toast.success("Papel removido");
    load();
  };

  const toggleHidden = async (row: ProfileRow) => {
    const fn = row.hidden_at ? restoreUserProfile : hideUserProfile;
    const r = await fn(row.id);
    if (!r.ok) return toast.error(r.error);
    toast.success(row.hidden_at ? "Usuário restaurado" : "Usuário ocultado do app");
    load();
  };

  const churchName = (id: string | null) => {
    if (!id) return "—";
    return churches.find((c) => c.id === id)?.name ?? "—";
  };

  const filtered = rows.filter((r) => {
    if (roleFilter === "none" && r.role !== null) return false;
    if (roleFilter === "admin" && r.role !== "admin") return false;
    if (roleFilter === "superadmin" && r.role !== "superadmin") return false;
    const t = `${r.first_name ?? ""} ${r.last_name ?? ""} ${r.email ?? ""}`.toLowerCase();
    return t.includes(q.toLowerCase());
  });

  const counts = {
    all: rows.length,
    none: rows.filter((r) => r.role === null).length,
    admin: rows.filter((r) => r.role === "admin").length,
    superadmin: rows.filter((r) => r.role === "superadmin").length,
  };

  return (
    <AdminPage
      title="Usuários & Roles"
      description="Promover Admins de Igreja ou Superadmins. Apenas o Superadmin acessa esta tela."
      Icon={Crown}
      variant="primary"
    >
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Buscar por nome ou email…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <Select value={roleFilter} onValueChange={(v: any) => setRoleFilter(v)}>
          <SelectTrigger className="w-full sm:w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos ({counts.all})</SelectItem>
            <SelectItem value="none">Sem papel ({counts.none})</SelectItem>
            <SelectItem value="admin">Admin Igreja ({counts.admin})</SelectItem>
            <SelectItem value="superadmin">Superadmin ({counts.superadmin})</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Papel</TableHead>
              <TableHead>Igreja vinculada</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Carregando…
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Nenhum usuário encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">
                    {r.first_name} {r.last_name}
                  </TableCell>
                  <TableCell>{r.email}</TableCell>
                  <TableCell>
                    {r.role === "superadmin" ? (
                      <Badge className="bg-primary text-primary-foreground">
                        <Crown className="w-3 h-3 mr-1" />
                        Superadmin
                      </Badge>
                    ) : r.role === "admin" ? (
                      <Badge>Admin Igreja</Badge>
                    ) : (
                      <Badge variant="secondary">User</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {churchName(r.role === "admin" ? r.role_church_id : r.profile_church_id)}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    {r.hidden_at && (
                      <Badge variant="outline" className="text-muted-foreground mr-1">
                        Oculto
                      </Badge>
                    )}
                    {r.role ? (
                      <Button size="sm" variant="outline" onClick={() => removeRole(r)}>
                        <ShieldOff className="w-4 h-4 mr-1" /> Remover
                      </Button>
                    ) : null}
                    <Button size="sm" onClick={() => openPromote(r)}>
                      <Shield className="w-4 h-4 mr-1" />
                      {r.role ? "Alterar" : "Promover"}
                    </Button>
                    <Button
                      size="sm"
                      variant={r.hidden_at ? "outline" : "ghost"}
                      onClick={() => toggleHidden(r)}
                      className={
                        r.hidden_at
                          ? undefined
                          : "text-destructive hover:text-destructive hover:bg-destructive/10"
                      }
                      title={r.hidden_at ? "Restaurar" : "Ocultar do app"}
                    >
                      {r.hidden_at ? (
                        <>
                          <Eye className="w-4 h-4 mr-1" /> Restaurar
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-4 h-4 mr-1" /> Apagar
                        </>
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={promoteOpen} onOpenChange={setPromoteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Definir papel</DialogTitle>
            <DialogDescription>
              {target ? `${target.first_name} ${target.last_name}` : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-muted-foreground">Papel</label>
              <Select value={newRole} onValueChange={(v: any) => setNewRole(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin de Igreja</SelectItem>
                  <SelectItem value="superadmin">Superadmin (acesso total)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {newRole === "admin" && (
              <div>
                <label className="text-sm text-muted-foreground">Igreja vinculada</label>
                <Select value={newChurchId} onValueChange={setNewChurchId}>
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
            <Button variant="outline" onClick={() => setPromoteOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={confirmPromote}>Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminPage>
  );
}
