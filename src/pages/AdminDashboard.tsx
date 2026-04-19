import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
} from "recharts";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Target, Clock, TrendingUp } from "lucide-react";
import { CloseSeasonButton } from "@/components/CloseSeasonButton";
import { ClassMaterialsManager } from "@/components/admin/ClassMaterialsManager";

interface ClassStats {
  className: string;
  totalParticipants: number;
  avgScore: number;
  avgTime: number;
  totalAttempts: number;
}

interface ParticipantData {
  name: string;
  score: number;
  time: number;
  className: string;
}

export default function AdminDashboard() {
  const [classStats, setClassStats] = useState<ClassStats[]>([]);
  const [participantData, setParticipantData] = useState<ParticipantData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Get classes (only Jovens and Adultos)
      const { data: classes } = await supabase
        .from("classes")
        .select("id, name")
        .in("name", ["Jovens", "Adultos"]);

      if (!classes || classes.length === 0) {
        setLoading(false);
        return;
      }

      const classIds = classes.map((c) => c.id);

      // Get all attempts for these classes
      const { data: attempts } = await supabase
        .from("quiz_attempts")
        .select("*, participants!inner(name, class_id)")
        .in("participants.class_id", classIds)
        .not("finished_at", "is", null);

      if (!attempts) {
        setLoading(false);
        return;
      }

      // Filter out test users
      const validAttempts = attempts.filter(
        (a: any) => a.participants?.name?.toUpperCase() !== "TESTE123"
      );

      // Build class stats
      const stats: ClassStats[] = classes.map((cls) => {
        const classAttempts = validAttempts.filter(
          (a: any) => a.participants?.class_id === cls.id
        );
        const uniqueParticipants = new Set(
          classAttempts.map((a: any) => a.participant_id)
        ).size;

        const avgScore =
          classAttempts.length > 0
            ? classAttempts.reduce((sum: number, a: any) => sum + a.score, 0) /
              classAttempts.length
            : 0;

        const avgTime =
          classAttempts.length > 0
            ? classAttempts.reduce(
                (sum: number, a: any) => sum + a.total_time_seconds,
                0
              ) / classAttempts.length
            : 0;

        const shortName = cls.name;

        return {
          className: shortName,
          totalParticipants: uniqueParticipants,
          avgScore: Math.round(avgScore * 10) / 10,
          avgTime: Math.round(avgTime),
          totalAttempts: classAttempts.length,
        };
      });

      // Build participant-level data for detailed chart
      const pData: ParticipantData[] = validAttempts.map((a: any) => {
        const cls = classes.find((c) => c.id === a.participants?.class_id);
        const shortName = cls?.name || "Desconhecido";
        return {
          name: a.participants?.name || "Anônimo",
          score: a.score,
          time: a.total_time_seconds,
          className: shortName,
        };
      });

      setClassStats(stats);
      setParticipantData(pData);
    } catch (err) {
      console.error("Error fetching admin data:", err);
    } finally {
      setLoading(false);
    }
  };

  const composedData = classStats.map((s) => ({
    turma: s.className,
    "Média de Acertos": s.avgScore,
    "Tempo Médio (s)": s.avgTime,
    Participantes: s.totalParticipants,
    Tentativas: s.totalAttempts,
  }));

  const jovensData = participantData
    .filter((p) => p.className === "Jovens")
    .sort((a, b) => b.score - a.score || a.time - b.time)
    .slice(0, 20);

  const adultosData = participantData
    .filter((p) => p.className === "Adultos")
    .sort((a, b) => b.score - a.score || a.time - b.time)
    .slice(0, 20);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground font-['Space_Grotesk']">
              📊 Painel Administrativo
            </h1>
            <p className="text-muted-foreground">
              Análise de desempenho por turma — Quiz EBD ADREC
            </p>
          </div>
          <CloseSeasonButton />
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {classStats.map((s) => (
            <div key={s.className} className="space-y-4 contents">
              <Card className="p-4 space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Users className="w-4 h-4" />
                  {s.className}
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {s.totalParticipants}
                </p>
                <p className="text-xs text-muted-foreground">participantes</p>
              </Card>
              <Card className="p-4 space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Target className="w-4 h-4" />
                  {s.className}
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {s.avgScore}
                </p>
                <p className="text-xs text-muted-foreground">média de acertos</p>
              </Card>
            </div>
          ))}
        </div>

        {/* Combined Chart: Bar (Acertos) + Line (Tempo) */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Visão Geral por Turma — Acertos × Tempo
          </h2>
          <ResponsiveContainer width="100%" height={350}>
            <ComposedChart data={composedData}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
              />
              <XAxis dataKey="turma" stroke="hsl(var(--muted-foreground))" />
              <YAxis
                yAxisId="left"
                stroke="hsl(var(--primary))"
                label={{
                  value: "Acertos",
                  angle: -90,
                  position: "insideLeft",
                  fill: "hsl(var(--muted-foreground))",
                }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="hsl(var(--secondary))"
                label={{
                  value: "Tempo (s)",
                  angle: 90,
                  position: "insideRight",
                  fill: "hsl(var(--muted-foreground))",
                }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  color: "hsl(var(--foreground))",
                }}
              />
              <Legend />
              <Bar
                yAxisId="left"
                dataKey="Média de Acertos"
                fill="hsl(var(--primary))"
                radius={[6, 6, 0, 0]}
                barSize={60}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="Tempo Médio (s)"
                stroke="hsl(var(--secondary))"
                strokeWidth={3}
                dot={{ r: 6, fill: "hsl(var(--secondary))" }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </Card>

        {/* Detailed per-class tabs */}
        <Tabs defaultValue="jovens">
          <TabsList className="mb-4">
            <TabsTrigger value="jovens">🎺 Jovens</TabsTrigger>
            <TabsTrigger value="adultos">🤵🏻 Adultos</TabsTrigger>
          </TabsList>

          <TabsContent value="jovens">
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">
                Top 20 Jovens — Acertos × Tempo
              </h2>
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={jovensData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                  />
                  <XAxis
                    dataKey="name"
                    stroke="hsl(var(--muted-foreground))"
                    angle={-35}
                    textAnchor="end"
                    height={80}
                    fontSize={11}
                  />
                  <YAxis
                    yAxisId="left"
                    stroke="hsl(var(--primary))"
                    label={{
                      value: "Acertos",
                      angle: -90,
                      position: "insideLeft",
                      fill: "hsl(var(--muted-foreground))",
                    }}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke="hsl(var(--secondary))"
                    label={{
                      value: "Tempo (s)",
                      angle: 90,
                      position: "insideRight",
                      fill: "hsl(var(--muted-foreground))",
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      color: "hsl(var(--foreground))",
                    }}
                  />
                  <Legend />
                  <Bar
                    yAxisId="left"
                    dataKey="score"
                    name="Acertos"
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="time"
                    name="Tempo (s)"
                    stroke="hsl(var(--secondary))"
                    strokeWidth={2}
                    dot={{ r: 4, fill: "hsl(var(--secondary))" }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </Card>
          </TabsContent>

          <TabsContent value="adultos">
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">
                Top 20 Adultos — Acertos × Tempo
              </h2>
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={adultosData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                  />
                  <XAxis
                    dataKey="name"
                    stroke="hsl(var(--muted-foreground))"
                    angle={-35}
                    textAnchor="end"
                    height={80}
                    fontSize={11}
                  />
                  <YAxis
                    yAxisId="left"
                    stroke="hsl(var(--primary))"
                    label={{
                      value: "Acertos",
                      angle: -90,
                      position: "insideLeft",
                      fill: "hsl(var(--muted-foreground))",
                    }}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke="hsl(var(--secondary))"
                    label={{
                      value: "Tempo (s)",
                      angle: 90,
                      position: "insideRight",
                      fill: "hsl(var(--muted-foreground))",
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      color: "hsl(var(--foreground))",
                    }}
                  />
                  <Legend />
                  <Bar
                    yAxisId="left"
                    dataKey="score"
                    name="Acertos"
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="time"
                    name="Tempo (s)"
                    stroke="hsl(var(--secondary))"
                    strokeWidth={2}
                    dot={{ r: 4, fill: "hsl(var(--secondary))" }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </Card>
          </TabsContent>
        </Tabs>

        <ClassMaterialsManager />

        {/* Stats table */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Resumo Numérico
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-3 text-muted-foreground">Turma</th>
                  <th className="text-center p-3 text-muted-foreground">Participantes</th>
                  <th className="text-center p-3 text-muted-foreground">Tentativas</th>
                  <th className="text-center p-3 text-muted-foreground">Média Acertos</th>
                  <th className="text-center p-3 text-muted-foreground">Tempo Médio</th>
                </tr>
              </thead>
              <tbody>
                {classStats.map((s) => (
                  <tr key={s.className} className="border-b border-border/50">
                    <td className="p-3 font-medium text-foreground">{s.className}</td>
                    <td className="p-3 text-center text-foreground">{s.totalParticipants}</td>
                    <td className="p-3 text-center text-foreground">{s.totalAttempts}</td>
                    <td className="p-3 text-center text-foreground">{s.avgScore}</td>
                    <td className="p-3 text-center text-foreground">{s.avgTime}s</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
