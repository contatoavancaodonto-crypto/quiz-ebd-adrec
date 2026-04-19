import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Users, Church, GraduationCap, ListChecks, Award, BookText } from "lucide-react";

interface Counts {
  users: number;
  admins: number;
  churches: number;
  classes: number;
  attempts: number;
  badges: number;
  verses: number;
  activeSeason: string | null;
}

export default function AdminOverview() {
  const [c, setC] = useState<Counts | null>(null);

  useEffect(() => {
    (async () => {
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
    })();
  }, []);

  const stat = (label: string, value: number | string, Icon: any) => (
    <Card className="p-4 space-y-1">
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <Icon className="w-4 h-4" /> {label}
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
    </Card>
  );

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
          {stat("Usuários", c.users, Users)}
          {stat("Admins", c.admins, Users)}
          {stat("Igrejas", c.churches, Church)}
          {stat("Turmas", c.classes, GraduationCap)}
          {stat("Tentativas", c.attempts, ListChecks)}
          {stat("Badges", c.badges, Award)}
          {stat("Versículos", c.verses, BookText)}
        </div>
      )}
    </div>
  );
}
