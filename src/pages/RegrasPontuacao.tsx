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
                    <div className="font-medium">Quiz semanal</div>
                    <div className="text-xs text-muted-foreground">(5 por lição)</div>
                  </TableCell>
                  <TableCell className="text-right font-bold">65 pontos</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <div className="font-medium">Bônus por realizar dentro da semana</div>
                    <div className="text-xs text-muted-foreground">(+1 ponto extra por lição)</div>
                  </TableCell>
                  <TableCell className="text-right font-bold text-green-600">+13 pontos</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <div className="font-medium">Provão trimestral</div>
                  </TableCell>
                  <TableCell className="text-right font-bold">20 pontos</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <div className="font-medium">Bônus de leitura semanal</div>
                    <div className="text-xs text-muted-foreground">(ao menos 5 semanas completas)</div>
                  </TableCell>
                  <TableCell className="text-right font-bold text-green-600">+2 pontos</TableCell>
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
                  <Clock className="w-4 h-4 text-primary" /> Quiz Semanal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Os quizzes realizados durante o trimestre valem juntos <strong>65 pontos</strong>.
                </p>
                <div className="mt-3 p-2 bg-green-50 rounded-lg border border-green-100">
                  <p className="text-xs font-bold text-green-700">⚡ Bônus Semanal</p>
                  <p className="text-[11px] text-green-600">
                    Se realizados na semana correta, você recebe <strong>+13 pontos</strong> extras.
                  </p>
                </div>
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
                  O provão final do trimestre vale <strong>20 pontos</strong> na sua média final.
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
                  Receba <strong>+2 pontos</strong> bônus se realizar pelo menos 5 semanas completas de leitura.
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
                  <span>Quizzes:</span>
                  <span>65 pts</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Bônus Semanal:</span>
                  <span>+13 pts</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Provão:</span>
                  <span>+20 pts</span>
                </div>
                <div className="flex justify-between text-xs border-b border-primary-foreground/20 pb-1">
                  <span>Bônus Leitura:</span>
                  <span>+2 pts</span>
                </div>
                <div className="flex justify-between font-bold pt-1">
                  <span>Total:</span>
                  <span>100 pts</span>
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
