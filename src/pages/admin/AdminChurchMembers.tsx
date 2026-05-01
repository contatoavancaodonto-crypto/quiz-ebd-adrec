import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useRoles } from "@/hooks/useRoles";
import { AdminPage } from "@/components/admin/AdminPage";
import { UsersRound } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Shield, ShieldOff, Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Navigate } from "react-router-dom";
import { EditMemberDialog, type EditableMember } from "@/components/admin/EditMemberDialog";

interface Member {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  area: number | null;
  is_admin: boolean;
}

interface ClassOpt {
  id: string;
  name: string;
}

export default function AdminChurchMembers() {
  const { isSuperadmin, isChurchAdmin, churchId, loading: rolesLoading } = useRoles();
  const [rows, setRows] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [editTarget, setEditTarget] = useState<EditableMember | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const load = async () => {
    if (!churchId) return;
    setLoading(true);
    const [{ data: profs }, { data: roles }] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, first_name, last_name, email, phone, area")
        .eq("church_id", churchId)
        .order("first_name", { ascending: true }),
      supabase
        .from("user_roles")
        .select("user_id, role, church_id")
        .eq("church_id", churchId)
        .eq("role", "admin"),
    ]);

    const adminSet = new Set((roles ?? []).map((r: any) => r.user_id));
    setRows(
      (profs ?? []).map((p: any) => ({
        id: p.id,
        first_name: p.first_name,
        last_name: p.last_name,
        email: p.email,
        phone: p.phone,
        area: p.area,
        is_admin: adminSet.has(p.id),
      }))
    );
    setLoading(false);
  };

  useEffect(() => {
    if (rolesLoading || !churchId) return;
    load();
    const channel = supabase
      .channel(`church-members-${churchId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles", filter: `church_id=eq.${churchId}` },
        () => load()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "user_roles", filter: `church_id=eq.${churchId}` },
        () => load()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rolesLoading, churchId]);

  if (rolesLoading) return null;
  if (!isChurchAdmin || isSuperadmin) return <Navigate to="/painel" replace />;

  const promote = async (m: Member) => {
    if (!churchId) return;
    const { error } = await supabase
      .from("user_roles")
      .insert({ user_id: m.id, role: "admin", church_id: churchId });
    if (error) return toast.error("Falha ao promover: " + error.message);
    toast.success("Membro promovido a admin local");
    load();
  };

  const revoke = async (m: Member) => {
    if (!churchId) return;
    const { error } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", m.id)
      .eq("role", "admin")
      .eq("church_id", churchId);
    if (error) return toast.error("Falha ao remover: " + error.message);
    toast.success("Privilégio de admin removido");
    load();
  };

  const filtered = useMemo(() => {
    if (!q) return rows;
    const ql = q.toLowerCase();
    return rows.filter((r) =>
      `${r.first_name ?? ""} ${r.last_name ?? ""} ${r.email ?? ""}`
        .toLowerCase()
        .includes(ql)
    );
  }, [rows, q]);

  return (
    <AdminPage
      title="Membros da Igreja"
      description={`${rows.length} ${rows.length === 1 ? "membro cadastrado" : "membros cadastrados"} · promova auxiliares a admin local.`}
      Icon={UsersRound}
      variant="primary"
    >

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Buscar por nome ou email…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Área</TableHead>
              <TableHead>Papel</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                  Carregando…
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Nenhum membro encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium">
                    {m.first_name} {m.last_name}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {m.email ?? "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {m.phone ?? "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {m.area ?? "—"}
                  </TableCell>
                  <TableCell>
                    {m.is_admin ? (
                      <Badge className="gap-1">
                        <Shield className="w-3 h-3" /> Admin
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Membro</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditTarget({
                          id: m.id,
                          first_name: m.first_name,
                          last_name: m.last_name,
                          email: m.email,
                          phone: m.phone,
                          area: m.area,
                        });
                        setEditOpen(true);
                      }}
                    >
                      <Pencil className="w-4 h-4 mr-1" /> Editar
                    </Button>
                    {m.is_admin ? (
                      <Button size="sm" variant="outline" onClick={() => revoke(m)}>
                        <ShieldOff className="w-4 h-4 mr-1" /> Remover admin
                      </Button>
                    ) : (
                      <Button size="sm" onClick={() => promote(m)}>
                        <Shield className="w-4 h-4 mr-1" /> Promover
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <EditMemberDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        member={editTarget}
        allowChurchEdit={false}
        onSaved={load}
      />
    </AdminPage>
  );
}
