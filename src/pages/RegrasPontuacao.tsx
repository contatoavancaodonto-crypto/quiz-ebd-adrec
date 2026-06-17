import { Medal, Trophy, Star, BookOpen, Info, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { MemberLayout } from "@/components/membro/MemberLayout";
import { PageShell } from "@/components/ui/page-shell";
import { PageHero } from "@/components/ui/page-hero";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const RegrasPontuacao = () => {
  return (
    <MemberLayout title="Regras & Pontuação" mobileHeader={{ variant: "full" }} contentPaddingMobile={false}>
      <PageShell contentClassName="px-4 py-6 max-w-2xl mx-auto w-full space-y-6">
        <PageHero
          eyebrow="Manual do Aluno"
          title="Sistema de Pontuação"
          description="Entenda como funciona o ranking e como acumular pontos no trimestre."
          Icon={Medal}
          variant="primary"
        />

        <section className="space-y-4">
          <div className="flex items-center gap-2 text-primary font-bold text-lg">
            <Trophy className="w-5 h-5" />
            <h2>Regras do Ranking</h2>
          </div>
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-6 space-y-3">
              <div className="flex gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                <p className="text-sm">Participantes com nota <strong>0</strong> não serão ranqueados.</p>
              </div>
              <div className="flex gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                <p className="text-sm">O ranking é atualizado automaticamente.</p>
              </div>
              <div className="flex gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                <p className="text-sm">O desempate acontece pelo menor tempo de conclusão.</p>
              </div>
              <div className="flex gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                <p className="text-sm">Apenas participantes com pontuação válida aparecem no ranking oficial.</p>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2 text-primary font-bold text-lg">
            <Star className="w-5 h-5" />
            <h2>Pontuação Oficial do Trimestre</h2>
          </div>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Atividade</TableHead>
                  <TableHead className="text-right">Pontuação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>
                    <div className="font-medium">Quizzes semanais das lições</div>
                    <div className="text-xs text-muted-foreground">(13 lições × 5 perguntas)</div>
                  </TableCell>
                  <TableCell className="text-right font-bold">65 pontos</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <div className="font-medium">Bônus de leitura semanal</div>
                    <div className="text-xs text-muted-foreground">(1 ponto por semana lida — 13 semanas)</div>
                  </TableCell>
                  <TableCell className="text-right font-bold text-green-600">+13 pontos</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <div className="font-medium">Provão trimestral</div>
                    <div className="text-xs text-muted-foreground">(vale o dobro: 26 pontos)</div>
                  </TableCell>
                  <TableCell className="text-right font-bold">26 pontos</TableCell>
                </TableRow>
                <TableRow className="bg-primary/5">
                  <TableCell className="font-bold">Total possível no trimestre</TableCell>
                  <TableCell className="text-right font-bold text-primary">104 pontos</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Card>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2 text-primary font-bold text-lg">
            <Info className="w-5 h-5" />
            <h2>Como Funciona</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" /> Quizzes das Lições
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Cada uma das <strong>13 lições</strong> do trimestre tem um quiz com <strong>5 perguntas</strong> (1 ponto cada), totalizando <strong>65 pontos</strong>.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-primary" /> Bônus de Leitura
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Marque a leitura da lição da semana e ganhe <strong>+1 ponto</strong> por semana. Em 13 semanas são até <strong>+13 pontos</strong>.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-primary" /> Provão Trimestral
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  O provão final tem perguntas de todas as lições e <strong>vale o dobro</strong>: <strong>26 pontos</strong> na sua nota do trimestre.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-primary text-primary-foreground">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Medal className="w-4 h-4" /> Pontuação Máxima
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>Quizzes das lições:</span>
                  <span>65 pts</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Bônus de leitura:</span>
                  <span>+13 pts</span>
                </div>
                <div className="flex justify-between text-xs border-b border-primary-foreground/20 pb-1">
                  <span>Provão (×2):</span>
                  <span>+26 pts</span>
                </div>
                <div className="flex justify-between font-bold pt-1">
                  <span>Total:</span>
                  <span>104 pts</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2 text-primary font-bold text-lg">
            <AlertCircle className="w-5 h-5" />
            <h2>Regras Gerais</h2>
          </div>
          <Card className="border-dashed">
            <CardContent className="pt-6">
              <ul className="space-y-2">
                <li className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                  O sistema salva automaticamente as respostas.
                </li>
                <li className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                  O tempo influencia no desempate do ranking.
                </li>
                <li className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                  Apenas a tentativa oficial entra no ranking.
                </li>
                <li className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                  Participantes com retry ficam ao final do ranking.
                </li>
                <li className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                  Certificados são liberados após conclusão do quiz.
                </li>
              </ul>
            </CardContent>
          </Card>
        </section>
      </PageShell>
    </MemberLayout>
  );
};

export default RegrasPontuacao;
