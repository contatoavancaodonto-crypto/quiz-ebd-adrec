import { useState } from "react";
import { Download, BookOpen } from "lucide-react";
import { MemberLayout } from "@/components/membro/MemberLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import revistaJovens from "@/assets/revista-jovens.png";

type RevistaItem = {
  id: string;
  title: string;
  subtitle: string;
  cover?: string; // será preenchido quando o usuário enviar as capas
  downloadUrl?: string; // será preenchido depois
};

const ALUNOS: RevistaItem[] = [
  { id: "adolescentes-aluno", title: "Adolescentes", subtitle: "Revista do Aluno" },
  { id: "jovens-aluno", title: "Jovens", subtitle: "Revista do Aluno", cover: revistaJovens },
const ALUNOS: RevistaItem[] = [
  { id: "adolescentes-aluno", title: "Adolescentes", subtitle: "Revista do Aluno" },
  { id: "jovens-aluno", title: "Jovens", subtitle: "Revista do Aluno", cover: revistaJovens },
  { id: "adultos-aluno", title: "Adultos", subtitle: "Revista do Aluno", cover: revistaJovens },
];

const PROFESSORES: RevistaItem[] = [
  { id: "adolescentes-prof", title: "Adolescentes", subtitle: "Revista do Professor" },
  { id: "jovens-prof", title: "Jovens", subtitle: "Revista do Professor", cover: revistaJovens },
  { id: "adultos-prof", title: "Adultos", subtitle: "Revista do Professor", cover: revistaJovens },
];

function RevistaCard({ item }: { item: RevistaItem }) {
  const handleDownload = () => {
    if (!item.downloadUrl) {
      toast.info("Em breve disponível para download.");
      return;
    }
    window.open(item.downloadUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <Card className="overflow-hidden transition-all hover:shadow-lg hover:-translate-y-0.5">
      <div className="aspect-[3/4] bg-muted flex items-center justify-center overflow-hidden">
        {item.cover ? (
          <img src={item.cover} alt={`Capa ${item.title} – ${item.subtitle}`} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <BookOpen className="h-16 w-16 text-muted-foreground/40" />
        )}
      </div>
      <CardContent className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-base leading-tight">{item.title}</h3>
          <p className="text-xs text-muted-foreground">{item.subtitle}</p>
        </div>
        <Button onClick={handleDownload} size="sm" className="w-full">
          <Download /> Baixar PDF
        </Button>
      </CardContent>
    </Card>
  );
}

export default function Revista() {
  const [tab, setTab] = useState("alunos");

  return (
    <MemberLayout title="Revista da Classe">
      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="alunos">Revistas Alunos</TabsTrigger>
          <TabsTrigger value="professores">Revistas Professores</TabsTrigger>
        </TabsList>

        <TabsContent value="alunos">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {ALUNOS.map((item) => (
              <RevistaCard key={item.id} item={item} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="professores">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {PROFESSORES.map((item) => (
              <RevistaCard key={item.id} item={item} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </MemberLayout>
  );
}
