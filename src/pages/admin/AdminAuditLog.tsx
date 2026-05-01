import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { History, Search, Crown, Shield } from "lucide-react";
import { useRoles } from "@/hooks/useRoles";
import { AdminPage } from "@/components/admin/AdminPage";

interface AuditRow {
  id: string;
  profile_id: string;
  edited_by: string | null;
  editor_name: string | null;
  editor_role: string | null;
  changes: Record<string, { from: any; to: any }>;
  created_at: string;
  target_name?: string | null;
  target_email?: string | null;
}

const FIELD_LABELS: Record<string, string> = {
  first_name: "Nome",
  last_name: "Sobrenome",
  email: "Email",
  phone: "Telefone",
  area: "Área",
  church_id: "Igreja",
  display_name: "Nome de exibição",
};

const fmt = (v: any) => {
  if (v === null || v === undefined || v === "") return "—";
  return String(v);
};

export default function AdminAuditLog() {
  const { isSuperadmin, loading: rolesLoading } = useRoles();
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [churchesMap, setChurchesMap] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  const load = async () => {
    setLoading(true);
    const { data: audits } = await (supabase as any)
      .from("profile_edit_audit")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);

    const auditList = (audits ?? []) as AuditRow[];
    const profileIds = Array.from(new Set(auditList.map((a) => a.profile_id)));

    const [{ data: profiles }, { data: churches }] = await Promise.all([
      profileIds.length
        ? supabase
            .from("profiles")
            .select("id, first_name, last_name, email")
            .in("id", profileIds)
        : Promise.resolve({ data: [] as any[] }),
      supabase.from("churches").select("id, name"),
    ]);

    const pMap = new Map<string, any>();
    (profiles ?? []).forEach((p: any) => pMap.set(p.id, p));
    const cMap = new Map<string, string>();
    (churches ?? []).forEach((c: any) => cMap.set(c.id, c.name));
    setChurchesMap(cMap);

    setRows(
      auditList.map((a) => {
        const p = pMap.get(a.profile_id);
        return {
          ...a,
          target_name: p
            ? `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() || "—"
            : "—",
          target_email: p?.email ?? null,
        };
      })
    );
    setLoading(false);
  };

  useEffect(() => {
    load();
    const channel = supabase
      .channel("admin-audit-rt")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "profile_edit_audit" },
        () => load()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatValue = (field: string, value: any) => {
    if (field === "church_id") {
      if (!value) return "—";
      return churchesMap.get(value) ?? "—";
    }
    return fmt(value);
  };

  const filtered = useMemo(() => {
    if (!q.trim()) return rows;
    const t = q.toLowerCase();
    return rows.filter((r) =>
      `${r.target_name ?? ""} ${r.target_email ?? ""} ${r.editor_name ?? ""}`
        .toLowerCase()
        .includes(t)
    );
  }, [rows, q]);

  if (rolesLoading) return null;
  if (!isSuperadmin) return <Navigate to="/painel" replace />;

  return (
    <AdminPage
      title="Histórico de Alterações"
      description="Auditoria de quem editou os dados dos membros e quando."
      Icon={History}
      variant="primary"
    >
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Buscar por membro ou editor…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Membro editado</TableHead>
              <TableHead>Editado por</TableHead>
              <TableHead>Alterações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  Carregando…
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  Nenhuma alteração registrada ainda.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((r) => {
                const fields = Object.keys(r.changes ?? {});
                return (
                  <TableRow key={r.id}>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                      {new Date(r.created_at).toLocaleString("pt-BR")}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{r.target_name}</div>
                      {r.target_email && (
                        <div className="text-xs text-muted-foreground">
                          {r.target_email}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{r.editor_name ?? "—"}</div>
                      {r.editor_role === "superadmin" ? (
                        <Badge className="bg-primary text-primary-foreground mt-1">
                          <Crown className="w-3 h-3 mr-1" />
                          Superadmin
                        </Badge>
                      ) : r.editor_role === "admin" ? (
                        <Badge className="mt-1">
                          <Shield className="w-3 h-3 mr-1" />
                          Admin
                        </Badge>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {fields.map((f) => (
                          <div key={f} className="text-sm">
                            <span className="font-medium">
                              {FIELD_LABELS[f] ?? f}:
                            </span>{" "}
                            <span className="text-muted-foreground line-through">
                              {formatValue(f, r.changes[f]?.from)}
                            </span>{" "}
                            <span className="text-muted-foreground">→</span>{" "}
                            <span className="text-foreground">
                              {formatValue(f, r.changes[f]?.to)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>
    </AdminPage>
  );
}
