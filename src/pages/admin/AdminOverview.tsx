import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
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
  Crown,
  Shield,
  Sparkles,
} from "lucide-react";
import { useRoles } from "@/hooks/useRoles";
import { PageHero, HeroChip } from "@/components/ui/page-hero";
import { SectionLabel } from "@/components/ui/page-shell";
import { StatCard } from "@/components/ui/stat-card";

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

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="h-24 rounded-3xl border border-border bg-card animate-pulse"
        />
      ))}
    </div>
  );
}

function SuperadminOverview() {
  const [c, setC] = useState<SuperadminCounts | null>(null);
  const navigate = useNavigate();

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
    <div className="space-y-5">
      <PageHero
        eyebrow="Painel Superadmin"
        title="Visão geral do sistema"
        description="Resumo em tempo real de toda a plataforma EBD."
        Icon={Crown}
        variant="primary"
      >
        {c?.activeSeason && (
          <HeroChip Icon={Sparkles}>Temporada ativa · {c.activeSeason}</HeroChip>
        )}
      </PageHero>

      <section className="space-y-2">
        <SectionLabel label="Indicadores gerais" color="primary" />
        {!c ? (
          <SkeletonGrid />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard 
              label="Usuários" 
              value={c.users} 
              Icon={Users} 
              tone="primary" 
              index={0} 
              onClick={() => navigate("/painel/usuarios")}
            />
            <StatCard 
              label="Admins" 
              value={c.admins} 
              Icon={ShieldCheck} 
              tone="secondary" 
              index={1} 
              onClick={() => navigate("/painel/admins-locais")}
            />
            <StatCard 
              label="Igrejas" 
              value={c.churches} 
              Icon={Church} 
              tone="indigo" 
              index={2} 
              onClick={() => navigate("/painel/igrejas")}
            />
            <StatCard 
              label="Turmas" 
              value={c.classes} 
              Icon={GraduationCap} 
              tone="emerald" 
              index={3} 
              onClick={() => navigate("/painel/turmas")}
            />
            <StatCard 
              label="Tentativas" 
              value={c.attempts} 
              Icon={ListChecks} 
              tone="amber" 
              index={4} 
              onClick={() => navigate("/painel/tentativas")}
            />
            <StatCard 
              label="Badges" 
              value={c.badges} 
              Icon={Award} 
              tone="rose" 
              index={5} 
              onClick={() => navigate("/painel/badges")}
            />
            <StatCard 
              label="Versículos" 
              value={c.verses} 
              Icon={BookText} 
              tone="primary" 
              index={6} 
              onClick={() => navigate("/painel/versiculos")}
            />
          </div>
        )}
      </section>
    </div>
  );
}

function ChurchAdminOverview({ churchId }: { churchId: string }) {
  const [c, setC] = useState<ChurchAdminCounts | null>(null);
  const navigate = useNavigate();

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
    <div className="space-y-5">
      <PageHero
        eyebrow="Admin local"
        title={c?.churchName ?? "Minha Igreja"}
        description="Acompanhe o desempenho dos membros da sua igreja em tempo real."
        Icon={Shield}
        variant="secondary"
      >
        <div className="flex flex-wrap gap-2">
          {c?.activeSeason && (
            <HeroChip Icon={Sparkles}>Temporada · {c.activeSeason}</HeroChip>
          )}
          {c && c.pendingRequests > 0 && (
            <HeroChip Icon={ShieldCheck}>
              {c.pendingRequests} solicitação{c.pendingRequests > 1 ? "ões" : ""} pendente
            </HeroChip>
          )}
        </div>
      </PageHero>

      <section className="space-y-2">
        <SectionLabel label="Indicadores da igreja" color="primary" />
        {!c ? (
          <SkeletonGrid />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <StatCard 
              label="Membros" 
              value={c.members} 
              Icon={UsersRound} 
              tone="primary" 
              index={0} 
              onClick={() => navigate("/painel/membros")}
            />
            <StatCard 
              label="Admins locais" 
              value={c.localAdmins} 
              Icon={ShieldCheck} 
              tone="secondary" 
              index={1} 
              onClick={() => navigate("/painel/admins-locais")}
            />
            <StatCard 
              label="Turmas usadas" 
              value={c.classesUsed} 
              Icon={GraduationCap} 
              tone="emerald" 
              index={2} 
              onClick={() => navigate("/painel/turmas")}
            />
            <StatCard 
              label="Tentativas concluídas" 
              value={c.attempts} 
              Icon={ListChecks} 
              tone="amber" 
              index={3} 
              onClick={() => navigate("/painel/tentativas")}
            />
            <StatCard
              label="Média de acertos"
              value={c.avgAccuracy !== null ? `${c.avgAccuracy.toFixed(1)}%` : "—"}
              Icon={Target}
              tone="indigo"
              index={4}
              onClick={() => navigate("/painel/tentativas")}
            />
            <StatCard
              label="Solicitações pendentes"
              value={c.pendingRequests}
              Icon={Church}
              tone="rose"
              index={5}
              onClick={() => navigate("/painel/minha-igreja")}
            />
          </div>
        )}
      </section>
    </div>
  );
}

export default function AdminOverview() {
  const { isSuperadmin, isChurchAdmin, churchId, loading } = useRoles();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }
  if (isSuperadmin) return <SuperadminOverview />;
  if (isChurchAdmin && churchId) return <ChurchAdminOverview churchId={churchId} />;
  return <SuperadminOverview />;
}
