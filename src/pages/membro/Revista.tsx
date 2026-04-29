import { useState } from "react";
import { Download, BookOpen, Lock, FileText } from "lucide-react";
import { motion } from "framer-motion";
import { MemberLayout } from "@/components/membro/MemberLayout";
import { PageShell } from "@/components/ui/page-shell";
import { PageHero } from "@/components/ui/page-hero";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import revistaJovens from "@/assets/revista-jovens.png";
import revistaAdultos from "@/assets/revista-adultos.png";
import revistaAdolescentes from "@/assets/revista-adolescentes.png";
import revistaJuvenis from "@/assets/revista-adolescentes.png"; // Usando a mesma para juvenis por enquanto


type RevistaItem = {
  id: string;
  title: string;
  subtitle: string;
  cover?: string;
  downloadUrl?: string;
  unavailable?: boolean;
};

const ALUNOS: RevistaItem[] = [
  { id: "adolescentes-aluno-13-14", title: "Adolescentes (13-14 anos)", subtitle: "Revista do Aluno", cover: revistaAdolescentes, unavailable: true },
  { id: "juvenis-aluno-15-17", title: "Juvenis (15-17 anos)", subtitle: "Revista do Aluno", cover: revistaJuvenis, unavailable: true },
  { id: "jovens-aluno", title: "Jovens", subtitle: "Revista do Aluno", cover: revistaJovens },
  { id: "adultos-aluno", title: "Adultos", subtitle: "Revista do Aluno", cover: revistaAdultos },
];

const PROFESSORES: RevistaItem[] = [
  { id: "adolescentes-prof-13-14", title: "Adolescentes (13-14 anos)", subtitle: "Revista do Professor", cover: revistaAdolescentes, unavailable: true },
  { id: "juvenis-prof-15-17", title: "Juvenis (15-17 anos)", subtitle: "Revista do Professor", cover: revistaJuvenis, unavailable: true },
  { id: "jovens-prof", title: "Jovens", subtitle: "Revista do Professor", cover: revistaJovens },
  { id: "adultos-prof", title: "Adultos", subtitle: "Revista do Professor", cover: revistaAdultos },
];

function RevistaCard({ item, index }: { item: RevistaItem; index: number }) {
  const handleDownload = () => {
    if (!item.downloadUrl) {
      toast.info("Em breve disponível para download.");
      return;
    }
    window.open(item.downloadUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="rounded-2xl overflow-hidden bg-card border border-border shadow-sm hover:shadow-lg transition-all"
    >
      <div className="relative aspect-[3/4] bg-muted flex items-center justify-center overflow-hidden">
        {item.cover ? (
          <img
            src={item.cover}
            alt={`Capa ${item.title} – ${item.subtitle}`}
            className={`w-full h-full object-cover ${item.unavailable ? "grayscale opacity-60" : ""}`}
            loading="lazy"
          />
        ) : (
          <BookOpen className="h-16 w-16 text-muted-foreground/40" />
        )}
        {item.unavailable && (
          <Badge variant="secondary" className="absolute top-2 right-2 gap-1 text-[10px]">
            <Lock className="h-2.5 w-2.5" /> Em breve
          </Badge>
        )}
      </div>
      <div className="p-3 space-y-2">
        <div>
          <h3 className="font-bold text-sm leading-tight text-foreground">{item.title}</h3>
          <p className="text-[10px] text-muted-foreground">{item.subtitle}</p>
        </div>
        <Button
          onClick={handleDownload}
          size="sm"
          className={`w-full h-9 text-xs ${item.unavailable ? "" : "gradient-primary"}`}
          variant={item.unavailable ? "secondary" : "default"}
          disabled={item.unavailable}
        >
          {item.unavailable ? (
            <><Lock className="w-3 h-3" /> Indisponível</>
          ) : (
            <><Download className="w-3 h-3" /> Baixar PDF</>
          )}
        </Button>
      </div>
    </motion.div>
  );
}

export default function Revista() {
  const [tab, setTab] = useState("alunos");

  return (
    <MemberLayout
      title="Revista"
      mobileHeader={{ variant: "back", title: "Revista da Classe", subtitle: "Lições do trimestre", backTo: "/" }}
    >
      <PageShell contentClassName="pb-4">
        <PageHero
          eyebrow="Trimestre atual"
          title="Revistas da EBD"
          description="Baixe as revistas para acompanhar as lições."
          Icon={FileText}
          variant="amber"
        />

        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="alunos">Alunos</TabsTrigger>
            <TabsTrigger value="professores">Professores</TabsTrigger>
          </TabsList>

          <TabsContent value="alunos" className="mt-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {ALUNOS.map((item, i) => (
                <RevistaCard key={item.id} item={item} index={i} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="professores" className="mt-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {PROFESSORES.map((item, i) => (
                <RevistaCard key={item.id} item={item} index={i} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </PageShell>
    </MemberLayout>
  );
}
