import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useRoles } from "@/hooks/useRoles";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Shield, ShieldOff, Loader2, ShieldCheck } from "lucide-react";
import { AdminPage } from "@/components/admin/AdminPage";
import { toast } from "sonner";
import { Link, Navigate } from "react-router-dom";

interface AdminEntry {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  created_at: string;
}

export default function AdminLocalAdmins() {
  const { isSuperadmin, isChurchAdmin, churchId, loading: rolesLoading } = useRoles();
  const [rows, setRows] = useState<AdminEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!churchId) return;
    setLoading(true);
    const { data: roles } = await supabase
      .from("user_roles")
      .select("user_id, created_at")
      .eq("role", "admin")
      .eq("church_id", churchId);

    const ids = (roles ?? []).map((r: any) => r.user_id);
    if (ids.length === 0) {
      setRows([]);
      setLoading(false);
      return;
    }
    const { data: profs } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, email")
      .in("id", ids);

    const profMap = new Map((profs ?? []).map((p: any) => [p.id, p]));
    setRows(
      (roles ?? []).map((r: any) => {
        const p = profMap.get(r.user_id) as any;
        return {
          user_id: r.user_id,
          first_name: p?.first_name ?? null,
          last_name: p?.last_name ?? null,
          email: p?.email ?? null,
          created_at: r.created_at,
        };
      })
    );
    setLoading(false);
  };

  useEffect(() => {
    if (rolesLoading || !churchId) return;
    load();
    const channel = supabase
      .channel(`local-admins-${churchId}`)
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
  if (!isChurchAdmin || isSuperadmin) return <Navigate to="/painel-ebd-2025" replace />;

  const revoke = async (a: AdminEntry) => {
    if (!confirm(`Remover ${a.first_name ?? "este admin"} do papel de admin local?`)) return;
    const { error } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", a.user_id)
      .eq("role", "admin")
      .eq("church_id", churchId!);
    if (error) return toast.error("Falha ao remover: " + error.message);
    toast.success("Admin removido");
    load();
  };

  return (
    <AdminPage
      title="Admins Locais"
      description="Pessoas com acesso ao painel da sua igreja."
      Icon={ShieldCheck}
      variant="secondary"
      actions={
        <Button asChild className="bg-white text-foreground hover:bg-white/90 shadow">
          <Link to="/painel-ebd-2025/membros">
            <Shield className="w-4 h-4 mr-1" /> Promover um membro
          </Link>
        </Button>
      }
    >

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Promovido em</TableHead>
              <TableHead>Papel</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                  Carregando…
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Nenhum admin local além de você.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((a) => (
                <TableRow key={a.user_id}>
                  <TableCell className="font-medium">
                    {a.first_name} {a.last_name}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {a.email ?? "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(a.created_at).toLocaleDateString("pt-BR")}
                  </TableCell>
                  <TableCell>
                    <Badge className="gap-1">
                      <Shield className="w-3 h-3" /> Admin
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" onClick={() => revoke(a)}>
                      <ShieldOff className="w-4 h-4 mr-1" /> Remover
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </AdminPage>
  );
}
