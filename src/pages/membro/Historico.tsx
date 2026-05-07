import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Loader2, 
  Trophy, 
  Calendar, 
  Clock, 
  TrendingUp, 
  BookOpen, 
  CheckCircle2, 
  AlertCircle,
  BarChart3
} from "lucide-react";
import { MemberLayout } from "@/components/membro/MemberLayout";
import { PageShell } from "@/components/ui/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";

// Mock Data structure
const mockData = {
  membroNome: "João Silva",
  turmaAtual: "Turma A",
  anos: [
    {
      ano: 2025,
      trimestres: [
        {
          trimestre: "1º TRI",
          mediaSemanal: 8.7,
          mediaFinal: 8.5,
          participacao: 92,
          frequencia: 87,
          ranking: 5,
          semanas: [
            { semana: 1, licao: 1, tema: "Introdução à Fé", nota: 8.5, status: "concluido" },
            { semana: 2, licao: 2, tema: "O Amor de Deus", nota: 9.0, status: "concluido" },
            { semana: 3, licao: 3, tema: "A Graça", nota: 8.0, status: "em_analise" },
          ],
          provaFinal: { nota: 8.2, peso: 0.3, status: "concluido" },
          comentariosProfessor: [{ id: "1", comentario: "Excelente evolução nas últimas semanas.", criadoEm: "2025-03-01" }]
        }
      ]
    }
  ]
};

const chartData = [
  { name: "Sem 1", nota: 6.5 },
  { name: "Sem 2", nota: 7.3 },
  { name: "Sem 3", nota: 8.0 },
  { name: "Sem 4", nota: 8.8 },
  { name: "Sem 5", nota: 8.5 },
];

export default function Historico() {
  const [ano, setAno] = useState("2025");
  const [tri, setTri] = useState("1º TRI");

  return (
    <MemberLayout title="Boletim Acadêmico" mobileHeader={{ title: "Boletim", backTo: "/" }}>
      <PageShell contentClassName="pb-12 space-y-8">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-3xl font-bold">Boletim Acadêmico</h1>
          <p className="text-muted-foreground">Acompanhe seu desempenho, evolução e histórico de atividades.</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Média Geral" value="8.7" icon={Trophy} />
          <StatCard title="Participação" value="92%" subtitle="11 de 12 semanas" icon={BookOpen} />
          <StatCard title="Frequência" value="87%" icon={Clock} />
          <StatCard title="Ranking" value="Top 5" icon={Trophy} />
        </div>

        {/* Filters */}
        <div className="flex gap-4">
          <Select value={ano} onValueChange={setAno}>
            <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="2025">2025</SelectItem></SelectContent>
          </Select>
          <Select value={tri} onValueChange={setTri}>
            <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="1º TRI">1º TRI</SelectItem></SelectContent>
          </Select>
        </div>

        {/* Performance Chart */}
        <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/50">
          <CardTitle className="text-sm font-medium mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" /> Evolução de Notas
          </CardTitle>
          <div className="h-[200px]">
            <ChartContainer config={{ nota: { label: "Nota", color: "hsl(var(--primary))" } }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis className="text-xs" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="nota" stroke="var(--color-nota)" strokeWidth={2} dot={{ fill: "var(--color-nota)" }} />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        </Card>

        {/* Table */}
        <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/50">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Semana</TableHead>
                <TableHead>Lição</TableHead>
                <TableHead>Tema</TableHead>
                <TableHead>Nota</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockData.anos[0].trimestres[0].semanas.map((s) => (
                <TableRow key={s.semana}>
                  <TableCell>{s.semana}</TableCell>
                  <TableCell>{s.licao}</TableCell>
                  <TableCell>{s.tema}</TableCell>
                  <TableCell>{s.nota}</TableCell>
                  <TableCell>
                    <Badge variant={s.status === 'concluido' ? 'default' : 'secondary'}>{s.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </PageShell>
    </MemberLayout>
  );
}

function StatCard({ title, value, subtitle, icon: Icon }: any) {
  return (
    <Card className="p-4 bg-card/50 border-border/50">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">{title}</p>
          <h3 className="text-2xl font-bold mt-1">{value}</h3>
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
        <Icon className="w-5 h-5 text-primary opacity-70" />
      </div>
    </Card>
  );
}
