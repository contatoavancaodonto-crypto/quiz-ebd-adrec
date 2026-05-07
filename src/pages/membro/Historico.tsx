import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Trophy, 
  Calendar, 
  Clock, 
  TrendingUp, 
  BookOpen, 
  CheckCircle2, 
  AlertCircle,
  BarChart3,
  User,
  GraduationCap,
  MessageSquare,
  Search,
  Filter,
  ArrowRight,
  Loader2
} from "lucide-react";
import { MemberLayout } from "@/components/membro/MemberLayout";
import { PageShell } from "@/components/ui/page-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts";
import { useFullProfile } from "@/hooks/useFullProfile";
import { useAcademicHistory } from "@/hooks/useAcademicHistory";
import { cn } from "@/lib/utils";

// Types
type Status = 'concluido' | 'pendente' | 'nao_enviado' | 'em_analise';

const statusMap: Record<Status, { label: string; color: string }> = {
  concluido: { label: "Concluído", color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" },
  pendente: { label: "Pendente", color: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
  nao_enviado: { label: "Não enviado", color: "bg-red-500/10 text-red-500 border-red-500/20" },
  em_analise: { label: "Em análise", color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
};

const formatTime = (ms: number) => {
  if (!ms) return "0m";
  const minutes = Math.floor(ms / 60000);
  if (minutes < 60) return `${minutes}m`;
  const hours = (minutes / 60).toFixed(1);
  return `${hours}h`;
};

export default function Historico() {
  const { data: profile } = useFullProfile();
  const { data: academicData, isLoading } = useAcademicHistory();
  const [selectedAno, setSelectedAno] = useState("2026");
  const [selectedTri, setSelectedTri] = useState("1º TRI");

  const currentTri = useMemo(() => {
    if (!academicData) return null;
    return academicData.trimestres.find(t => t.trimestre === selectedTri) || academicData.trimestres[0];
  }, [academicData, selectedTri]);

  const stats = useMemo(() => {
    if (!currentTri) return null;

    return {
      mediaSemanal: currentTri.mediaSemanal.toFixed(1),
      mediaFinal: currentTri.mediaFinal.toFixed(1),
      participacao: Math.round(currentTri.participacao),
      concluidas: currentTri.semanas.filter(s => s.status === 'concluido').length,
      totalSemanas: currentTri.semanas.length,
      frequencia: Math.round(currentTri.frequencia),
      ranking: currentTri.ranking,
      provaFinalNota: currentTri.provaFinal?.nota?.toFixed(1) || "—",
      provaFinalStatus: currentTri.provaFinal?.status || "pendente",
      tempoTotal: formatTime(currentTri.tempoTotalMs)
    };
  }, [currentTri]);

  const chartData = useMemo(() => {
    if (!currentTri) return [];
    return currentTri.semanas
      .filter(s => s.nota !== undefined)
      .map(s => ({
        name: `Sem ${s.semana}`,
        nota: s.nota
      }));
  }, [currentTri]);

  return (
    <MemberLayout 
      title="Boletim Acadêmico" 
      mobileHeader={{ variant: "back", title: "Boletim Acadêmico", backTo: "/" }}
    >
      <PageShell contentClassName="pb-20 space-y-8">
        {/* Cabeçalho Profissional */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-4"
        >
          <div className="space-y-1">
            <h1 className="text-3xl font-display font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Boletim Acadêmico
            </h1>
            <p className="text-muted-foreground text-sm max-w-md">
              Acompanhe seu desempenho, evolução e histórico de atividades de forma detalhada.
            </p>
          </div>
          
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-card/40 border border-border/50 backdrop-blur-sm">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-bold leading-none">{profile?.first_name} {profile?.last_name}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1 font-medium">
                Minha Turma (Adultos)
              </p>
            </div>
          </div>
        </motion.div>

        {/* Loading state */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground animate-pulse">Sincronizando dados acadêmicos...</p>
          </div>
        )}

        {!isLoading && (
          <>
            {/* Filtros */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex flex-wrap items-center gap-3 bg-muted/30 p-2 rounded-2xl w-fit"
            >
              <div className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-muted-foreground">
                <Filter className="w-3.5 h-3.5" />
                Filtrar por:
              </div>
              <Select value={selectedAno} onValueChange={setSelectedAno}>
                <SelectTrigger className="w-[110px] h-9 rounded-xl border-none bg-background/50 shadow-none focus:ring-0">
                  <SelectValue placeholder="Ano" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2026">2026</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedTri} onValueChange={setSelectedTri}>
                <SelectTrigger className="w-[120px] h-9 rounded-xl border-none bg-background/50 shadow-none focus:ring-0">
                  <SelectValue placeholder="Trimestre" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1º TRI">1º Trimestre</SelectItem>
                  <SelectItem value="2º TRI">2º Trimestre</SelectItem>
                  <SelectItem value="3º TRI">3º Trimestre</SelectItem>
                  <SelectItem value="4º TRI">4º Trimestre</SelectItem>
                  <SelectItem value="Todos">Todos</SelectItem>
                </SelectContent>
              </Select>
            </motion.div>

            {/* Cards Superiores de Resumo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <StatCard 
                label="Média Geral" 
                value={stats?.mediaFinal || "0.0"} 
                icon={TrendingUp} 
                color="emerald"
                description={`Semanal: ${stats?.mediaSemanal}`}
                delay={0.1}
              />
              <StatCard 
                label="Participação" 
                value={`${stats?.participacao || 0}%`} 
                icon={BookOpen} 
                color="blue"
                description={`${stats?.concluidas} de ${stats?.totalSemanas} lições`}
                delay={0.2}
              />
              <StatCard 
                label="Frequência" 
                value={`${stats?.frequencia || 0}%`} 
                icon={Clock} 
                color="purple"
                description={`Tempo total: ${stats?.tempoTotal || "0m"}`}
                delay={0.3}
              />
              <StatCard 
                label="Provão Final" 
                value={stats?.provaFinalNota || "—"} 
                icon={GraduationCap} 
                color="amber"
                description={stats?.provaFinalStatus === 'concluido' ? 'Concluído' : 'Pendente'}
                delay={0.4}
              />
              <StatCard 
                label="Ranking" 
                value={stats?.ranking ? `#${stats.ranking}` : "—"} 
                icon={Trophy} 
                color="rose"
                description="Posição na turma"
                delay={0.5}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Gráfico de Evolução */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="lg:col-span-2"
              >
                <Card className="border-border/50 bg-card/30 backdrop-blur-sm overflow-hidden h-full">
                  <div className="p-6 pb-2">
                    <h3 className="text-sm font-bold flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-primary" />
                      Evolução de Desempenho
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">Sua trajetória de notas ao longo das semanas.</p>
                  </div>
                  <div className="h-[280px] w-full p-4 pr-8">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <defs>
                          <linearGradient id="colorNota" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground))" opacity={0.1} />
                        <XAxis 
                          dataKey="name" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} 
                          dy={10}
                        />
                        <YAxis 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} 
                          domain={[0, 10]}
                        />
                        <Tooltip 
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="bg-background/95 backdrop-blur-md border border-border p-3 rounded-xl shadow-xl">
                                  <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">{payload[0].payload.name}</p>
                                  <p className="text-sm font-bold text-primary">Nota: {payload[0].value}</p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="nota" 
                          stroke="hsl(var(--primary))" 
                          strokeWidth={3} 
                          dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4, stroke: 'hsl(var(--background))' }}
                          activeDot={{ r: 6, strokeWidth: 0 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </motion.div>

              {/* Comentários do Professor */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <Card className="border-border/50 bg-card/30 backdrop-blur-sm h-full">
                  <div className="p-6 pb-2">
                    <h3 className="text-sm font-bold flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-primary" />
                      Comentários Pedagógicos
                    </h3>
                  </div>
                  <div className="p-6 space-y-4">
                    {currentTri?.comentariosProfessor?.map((c: any) => {
                      const handleMarkAsRead = async () => {
                        if (c.lido) return;
                        await supabase
                          .from("academic_comments")
                          .update({ is_read: true, read_at: new Date().toISOString() })
                          .eq("id", c.id);
                      };

                      return (
                        <div 
                          key={c.id} 
                          className={cn(
                            "relative pl-4 border-l-2 space-y-1 transition-all",
                            c.lido ? "border-primary/20 opacity-70" : "border-primary font-medium"
                          )}
                          onMouseEnter={handleMarkAsRead}
                          onTouchStart={handleMarkAsRead}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-primary uppercase">{c.professorNome || 'Professor'}</span>
                              {!c.lido && <Badge className="h-1.5 w-1.5 rounded-full p-0 bg-primary border-none" />}
                            </div>
                            <span className="text-[10px] text-muted-foreground">{new Date(c.criadoEm).toLocaleDateString()}</span>
                          </div>
                          <p className="text-xs text-foreground/80 leading-relaxed italic">
                            "{c.comentario}"
                          </p>
                        </div>
                      );
                    })}
                    {!currentTri?.comentariosProfessor?.length && (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <MessageSquare className="w-8 h-8 text-muted-foreground/20 mb-2" />
                        <p className="text-xs text-muted-foreground">Nenhum comentário por enquanto.</p>
                      </div>
                    )}
                  </div>
                </Card>
              </motion.div>
            </div>

            {/* Tabela Principal */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  Detalhamento por Trimestre
                </h2>
                <Badge variant="outline" className="rounded-full px-3 font-bold border-primary/20 text-primary bg-primary/5">
                  {selectedTri}
                </Badge>
              </div>

              <div className="space-y-4">
                {/* Versão Desktop (Tabela) */}
                <div className="hidden md:block rounded-3xl border border-border/50 bg-card/30 backdrop-blur-sm overflow-hidden shadow-sm">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow className="border-border/50 hover:bg-transparent">
                        <TableHead className="w-[80px] text-[10px] font-bold uppercase tracking-wider">Semana</TableHead>
                        <TableHead className="w-[80px] text-[10px] font-bold uppercase tracking-wider">Lição</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase tracking-wider">Tema da Lição</TableHead>
                        <TableHead className="w-[100px] text-[10px] font-bold uppercase tracking-wider text-center">Nota</TableHead>
                        <TableHead className="w-[140px] text-[10px] font-bold uppercase tracking-wider text-center">Status</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase tracking-wider">Observações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentTri?.semanas.map((s: any, idx: number) => (
                        <TableRow key={idx} className="border-border/50 hover:bg-muted/30 transition-colors">
                          <TableCell className="font-medium text-xs">Sem. {s.semana}</TableCell>
                          <TableCell className="text-xs">{s.licao}</TableCell>
                          <TableCell className="text-xs font-semibold">{s.tema}</TableCell>
                          <TableCell className="text-center">
                            {s.nota !== undefined ? (
                              <span className={cn(
                                "inline-flex items-center justify-center w-8 h-8 rounded-lg font-bold text-xs",
                                s.nota >= 7 ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
                              )}>
                                {s.nota.toFixed(1)}
                              </span>
                            ) : (
                              <span className="text-muted-foreground text-[10px]">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className={cn("rounded-full px-2.5 py-0.5 text-[10px] font-bold border", statusMap[s.status as Status].color)}>
                              {statusMap[s.status as Status].label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                            {s.observacao || "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                      
                      {/* Linha do Provão Final Desktop */}
                      {currentTri?.provaFinal && (
                        <TableRow className="bg-primary/5 border-t-2 border-primary/20 hover:bg-primary/10 transition-colors">
                          <TableCell colSpan={3} className="py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                                <GraduationCap className="w-4 h-4 text-primary" />
                              </div>
                              <div>
                                <p className="text-xs font-bold text-primary uppercase tracking-tight">Provão Final do Trimestre</p>
                                <p className="text-[10px] text-muted-foreground font-medium">Peso: {Math.round(currentTri.provaFinal.peso * 100) || 40}% na média final</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center font-bold text-sm text-primary">
                            {currentTri.provaFinal.nota?.toFixed(1) || "—"}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className={cn(
                              "rounded-full px-2.5 py-0.5 text-[10px] font-bold border",
                              currentTri.provaFinal.status === 'concluido' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                            )}>
                              {currentTri.provaFinal.status === 'concluido' ? 'Concluído' : 'Pendente'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {currentTri.provaFinal.observacao || "Avaliação final acumulativa."}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Versão Mobile (Cards) */}
                <div className="grid grid-cols-1 gap-4 md:hidden">
                  {currentTri?.semanas.map((s: any, idx: number) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * idx }}
                    >
                      <Card className="border-border/50 bg-card/30 backdrop-blur-sm overflow-hidden p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-[9px] font-bold px-1.5 py-0 uppercase border-primary/20 text-primary">
                                Semana {s.semana}
                              </Badge>
                              <span className="text-[10px] text-muted-foreground font-medium">Lição {s.licao}</span>
                            </div>
                            <h4 className="text-sm font-bold leading-tight">{s.tema}</h4>
                          </div>
                          
                          {s.nota !== undefined ? (
                            <div className={cn(
                              "flex flex-col items-center justify-center min-w-[40px] h-[40px] rounded-xl font-bold border shadow-sm",
                              s.nota >= 7 ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                            )}>
                              <span className="text-[9px] uppercase opacity-60 leading-none mb-0.5">Nota</span>
                              <span className="text-sm leading-none">{s.nota.toFixed(1)}</span>
                            </div>
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-muted/30 border border-border/50 flex items-center justify-center">
                              <span className="text-muted-foreground text-xs">—</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between pt-1">
                          <Badge className={cn("rounded-full px-2.5 py-0.5 text-[10px] font-bold border shadow-none", statusMap[s.status as Status].color)}>
                            {statusMap[s.status as Status].label}
                          </Badge>
                          {s.observacao && (
                            <p className="text-[10px] text-muted-foreground italic truncate max-w-[150px]">
                              "{s.observacao}"
                            </p>
                          )}
                        </div>
                      </Card>
                    </motion.div>
                  ))}

                  {/* Card Provão Final Mobile */}
                  {currentTri?.provaFinal && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="mt-2"
                    >
                      <Card className="border-primary/30 bg-primary/5 backdrop-blur-md overflow-hidden p-4 relative">
                        <div className="absolute top-0 right-0 p-2">
                          <Trophy className="w-10 h-10 text-primary/10" />
                        </div>
                        
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                            <GraduationCap className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-primary uppercase tracking-wider">Provão Final</h4>
                            <p className="text-[10px] text-muted-foreground">Avaliação trimestral</p>
                          </div>
                        </div>

                        <div className="flex items-end justify-between gap-4">
                          <div className="space-y-1">
                            <p className="text-[10px] text-muted-foreground font-medium">Peso: {Math.round(currentTri.provaFinal.peso * 100) || 40}% na média</p>
                            <Badge className={cn(
                              "rounded-full px-2.5 py-0.5 text-[10px] font-bold border shadow-none",
                              currentTri.provaFinal.status === 'concluido' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                            )}>
                              {currentTri.provaFinal.status === 'concluido' ? 'Concluído' : 'Pendente'}
                            </Badge>
                          </div>
                          
                          <div className="flex flex-col items-end">
                            <span className="text-[10px] text-primary font-bold uppercase mb-1">Média Final</span>
                            <div className="text-3xl font-display font-bold text-primary">
                              {currentTri.provaFinal.nota?.toFixed(1) || "—"}
                            </div>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Comentários do Professor */}
            {currentTri?.comentariosProfessor && currentTri.comentariosProfessor.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-display font-bold">Feedback do Professor</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {currentTri.comentariosProfessor.map((com: any) => (
                    <Card key={com.id} className="border-primary/10 bg-primary/5 backdrop-blur-sm">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">
                              {com.professorNome?.charAt(0) || "P"}
                            </div>
                            <div>
                              <p className="text-xs font-bold">{com.professorNome}</p>
                              <p className="text-[10px] text-muted-foreground">
                                {new Date(com.criadoEm).toLocaleDateString('pt-BR')}
                              </p>
                            </div>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed italic">
                          "{com.comentario}"
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </motion.div>
            )}
          </>
        )}
      </PageShell>
    </MemberLayout>
  );
}

function StatCard({ label, value, icon: Icon, color, description, delay = 0 }: any) {
  const colors: any = {
    emerald: "from-emerald-500/20 to-emerald-500/5 text-emerald-500 border-emerald-500/20",
    blue: "from-blue-500/20 to-blue-500/5 text-blue-500 border-blue-500/20",
    purple: "from-purple-500/20 to-purple-500/5 text-purple-500 border-purple-500/20",
    amber: "from-amber-500/20 to-amber-500/5 text-amber-500 border-amber-500/20",
    rose: "from-rose-500/20 to-rose-500/5 text-rose-500 border-rose-500/20",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      whileHover={{ y: -4 }}
      className={cn(
        "relative group p-5 rounded-3xl bg-gradient-to-br border backdrop-blur-sm overflow-hidden",
        colors[color]
      )}
    >
      <div className="relative z-10 flex flex-col justify-between h-full">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">{label}</p>
          <div className="p-2 rounded-xl bg-background/20 group-hover:scale-110 transition-transform">
            <Icon className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-4">
          <h3 className="text-2xl font-display font-bold text-foreground leading-none">{value}</h3>
          {description && (
            <p className="text-[10px] mt-1.5 font-medium text-muted-foreground line-clamp-1">{description}</p>
          )}
        </div>
      </div>
      
      <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-current opacity-[0.03] blur-2xl group-hover:opacity-10 transition-opacity rounded-full" />
    </motion.div>
  );
}
