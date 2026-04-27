import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import {
  Users,
  Church,
  GraduationCap,
  ListChecks,
  Award,
  BookText,
  Target,
  UsersRound,
  ShieldCheck,
} from "lucide-react";
import { useRoles } from "@/hooks/useRoles";

interface SuperadminCounts {
  users: number;
  admins: number;
  churches: number;
  classes: number;
  attempts: number;
  badges: number;
  verses: number;
  activeSeason: string | null;
}

interface ChurchAdminCounts {
  churchName: string | null;
  members: number;
  localAdmins: number;
  attempts: number;
  avgAccuracy: number | null;
  classesUsed: number;
  pendingRequests: number;
  activeSeason: string | null;
}

function StatCard({
  label,
  value,
  Icon,
}: {
  label: string;
  value: number | string;
  Icon: any;
}) {
  return (
    <Card className="p-4 space-y-1">
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <Icon className="w-4 h-4" /> {label}
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
    </Card>
  );
}

function SuperadminOverview() {
  const [c, setC] = useState<SuperadminCounts | null>(null);

  const load = useCallback(async () => {
    const [u, a, ch, cls, att, bd, vs, sn] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("user_roles").select("id", { count: "exact", head: true }).eq("role", "admin"),
      supabase.from("churches").select("id", { count: "exact", head: true }),
      supabase.from("classes").select("id", { count: "exact", head: true }),
      supabase.from("quiz_attempts").select("id", { count: "exact", head: true }).not("finished_at", "is", null),
      supabase.from("badges").select("id", { count: "exact", head: true }),
      supabase.from("verses").select("id", { count: "exact", head: true }),
      supabase.from("seasons").select("name").eq("status", "active").maybeSingle(),
    ]);
    setC({
      users: u.count ?? 0,
      admins: a.count ?? 0,
      churches: ch.count ?? 0,
      classes: cls.count ?? 0,
      attempts: att.count ?? 0,
      badges: bd.count ?? 0,
      verses: vs.count ?? 0,
      activeSeason: sn.data?.name ?? null,
    });
  }, []);

  useEffect(() => {
    load();
    const tables = ["profiles", "user_roles", "churches", "classes", "quiz_attempts", "badges", "verses", "seasons"];
    const channel = supabase.channel("admin-overview-rt");
    tables.forEach((t) => {
      channel.on("postgres_changes", { event: "*", schema: "public", table: t }, () => load());
    });
    channel.subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [load]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Visão Geral</h2>
        <p className="text-sm text-muted-foreground">
          Resumo geral do sistema {c?.activeSeason && `· Temporada ativa: ${c.activeSeason}`}
        </p>
      </div>
      {!c ? (
        <p className="text-muted-foreground">Carregando…</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Usuários" value={c.users} Icon={Users} />
          <StatCard label="Admins" value={c.admins} Icon={Users} />
          <StatCard label="Igrejas" value={c.churches} Icon={Church} />
          <StatCard label="Turmas" value={c.classes} Icon={GraduationCap} />
          <StatCard label="Tentativas" value={c.attempts} Icon={ListChecks} />
          <StatCard label="Badges" value={c.badges} Icon={Award} />
          <StatCard label="Versículos" value={c.verses} Icon={BookText} />
        </div>
      )}
    </div>
  );
}

function ChurchAdminOverview({ churchId }: { churchId: string }) {
  const [c, setC] = useState<ChurchAdminCounts | null>(null);

  const load = useCallback(async () => {
    const [chData, profsRes, adminsRes, attemptsRes, pendingRes, seasonRes] = await Promise.all([
      supabase.from("churches").select("name").eq("id", churchId).maybeSingle(),
      supabase
        .from("profiles")
        .select("id, class_id")
        .eq("church_id", churchId),
      supabase
        .from("user_roles")
        .select("id", { count: "exact", head: true })
        .eq("role", "admin")
        .eq("church_id", churchId),
      // Tentativas dos perfis dessa igreja: precisamos cruzar com participants pelo nome.
      // Como a chave é "name" entre profiles e participants, fazemos por etapas.
      supabase
        .from("profiles")
        .select("first_name, last_name")
        .eq("church_id", churchId),
      supabase
        .from("church_edit_requests")
        .select("id", { count: "exact", head: true })
        .eq("church_id", churchId)
        .eq("status", "pending"),
      supabase.from("seasons").select("name").eq("status", "active").maybeSingle(),
    ]);

    const profiles = profsRes.data ?? [];
    const members = profiles.length;
    const classesUsed = new Set(profiles.map((p: any) => p.class_id).filter(Boolean)).size;

    // Mapeia nomes para buscar tentativas
    const norm = (s: string) => s.toLowerCase().trim().replace(/\s+/g, " ");
    const allowedNames = new Set(
      (attemptsRes.data ?? []).map((p: any) =>
        norm(`${p.first_name ?? ""} ${p.last_name ?? ""}`)
      )
    );

    let totalAttempts = 0;
    let sumAcc = 0;
    let countAcc = 0;
    if (allowedNames.size > 0) {
      const { data: atts } = await supabase
        .from("quiz_attempts")
        .select("accuracy_percentage, participants(name)")
        .not("finished_at", "is", null)
        .limit(2000);
      (atts ?? []).forEach((a: any) => {
        const nm = norm(a.participants?.name ?? "");
        if (allowedNames.has(nm)) {
          totalAttempts += 1;
          if (a.accuracy_percentage !== null) {
            sumAcc += Number(a.accuracy_percentage);
            countAcc += 1;
          }
        }
      });
    }

    setC({
      churchName: chData.data?.name ?? null,
      members,
      localAdmins: adminsRes.count ?? 0,
      attempts: totalAttempts,
      avgAccuracy: countAcc > 0 ? sumAcc / countAcc : null,
      classesUsed,
      pendingRequests: pendingRes.count ?? 0,
      activeSeason: seasonRes.data?.name ?? null,
    });
  }, [churchId]);

  useEffect(() => {
    load();
    const channel = supabase
      .channel(`church-overview-${churchId}`)
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
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "church_edit_requests", filter: `church_id=eq.${churchId}` },
        () => load()
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "quiz_attempts" }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [churchId, load]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">
          {c?.churchName ?? "Minha Igreja"}
        </h2>
        <p className="text-sm text-muted-foreground">
          Visão geral da sua igreja {c?.activeSeason && `· Temporada ativa: ${c.activeSeason}`}
        </p>
      </div>
      {!c ? (
        <p className="text-muted-foreground">Carregando…</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Membros" value={c.members} Icon={UsersRound} />
          <StatCard label="Admins locais" value={c.localAdmins} Icon={ShieldCheck} />
          <StatCard label="Turmas usadas" value={c.classesUsed} Icon={GraduationCap} />
          <StatCard label="Tentativas concluídas" value={c.attempts} Icon={ListChecks} />
          <StatCard
            label="Média de acertos"
            value={c.avgAccuracy !== null ? `${c.avgAccuracy.toFixed(1)}%` : "—"}
            Icon={Target}
          />
          <StatCard label="Solicitações pendentes" value={c.pendingRequests} Icon={Church} />
        </div>
      )}
    </div>
  );
}

export default function AdminOverview() {
  const { isSuperadmin, isChurchAdmin, churchId, loading } = useRoles();

  if (loading) return <p className="text-muted-foreground">Carregando…</p>;
  if (isSuperadmin) return <SuperadminOverview />;
  if (isChurchAdmin && churchId) return <ChurchAdminOverview churchId={churchId} />;
  return <SuperadminOverview />;
}
