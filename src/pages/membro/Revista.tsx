import { useEffect, useState, useMemo } from "react";
import { Download, BookOpen, Lock, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
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
import revistaPreadolescentes from "@/assets/revista-preadolescentes.png";
import revistaJuvenis from "@/assets/revista-juvenis.png";



import { useFullProfile } from "@/hooks/useFullProfile";

type RevistaItem = {
  id: string;
  title: string;
  subtitle: string;
  cover?: string;
  downloadUrl?: string;
  unavailable?: boolean;
};

// Mock data for static display while loading or as fallback
const STATIC_ALUNOS: RevistaItem[] = [
  { 
    id: "preadolescentes-aluno-11-12", 
    title: "Pré-Adolescentes (11-12 anos)", 
    subtitle: "Revista do Aluno", 
    cover: revistaPreadolescentes, 
    downloadUrl: "https://drive.google.com/uc?export=download&id=1vP5aUzLRDK6w5GrOS2FxE1e9ZtrgFLor" 
  },
  { 
    id: "adolescentes-aluno-13-14", 
    title: "Adolescentes (13-14 anos)", 
    subtitle: "Revista do Aluno", 
    cover: revistaAdolescentes, 
    downloadUrl: "https://drive.google.com/uc?export=download&id=157WDP8b5764_t9YWchbQB3AuI76plWWm" 
  },
  { 
    id: "juvenis-aluno-15-17", 
    title: "Juvenis (15-17 anos)", 
    subtitle: "Revista do Aluno", 
    cover: revistaJuvenis, 
    downloadUrl: "https://drive.google.com/uc?export=download&id=1nA7A3WB3cwY3mBw5-MeUVIyjDbvO0ei3" 
  },
  { 
    id: "jovens-aluno", 
    title: "Jovens", 
    subtitle: "Revista do Aluno", 
    cover: revistaJovens,
    downloadUrl: "https://drive.google.com/uc?export=download&id=1l2C0-qMDZzCYLwOHqQ7z_Qdv-HTphHTV"
  },
  { 
    id: "adultos-aluno", 
    title: "Adultos", 
    subtitle: "Revista do Aluno", 
    cover: revistaAdultos, 
    downloadUrl: "https://drive.google.com/uc?export=download&id=12jsfPsQsZ558ZCOVLxYaITLkpcCmUMuE" 
  },
];

const STATIC_PROFESSORES: RevistaItem[] = [
  { 
    id: "preadolescentes-prof-11-12", 
    title: "Pré-Adolescentes (11-12 anos)", 
    subtitle: "Revista do Professor", 
    cover: revistaPreadolescentes, 
    downloadUrl: "https://drive.google.com/uc?export=download&id=1l0N3HsZavKCggzauTR1SLK0Mbr0Rt9rZ" 
  },
  { 
    id: "adolescentes-prof-13-14", 
    title: "Adolescentes (13-14 anos)", 
    subtitle: "Revista do Professor", 
    cover: revistaAdolescentes, 
    downloadUrl: "https://drive.google.com/uc?export=download&id=1ej0g5-yZU2Q_UcyqKi7SrK1PjnjkZEe_" 
  },
  { 
    id: "juvenis-prof-15-17", 
    title: "Juvenis (15-17 anos)", 
    subtitle: "Revista do Professor", 
    cover: revistaJuvenis, 
    downloadUrl: "https://drive.google.com/uc?export=download&id=13iE5aMz85JUGusO12xPmLBSlnp6Ob2dF" 
  },
  { 
    id: "jovens-prof", 
    title: "Jovens", 
    subtitle: "Revista do Professor", 
    cover: revistaJovens, 
    downloadUrl: "https://drive.google.com/uc?export=download&id=1l2C0-qMDZzCYLwOHqQ7z_Qdv-HTphHTV" 
  },
  { 
    id: "adultos-prof", 
    title: "Adultos", 
    subtitle: "Revista do Professor", 
    cover: revistaAdultos, 
    downloadUrl: "https://drive.google.com/uc?export=download&id=1wl_rdAJFMwCsoH5mHIeTl9TJ-0Pewcom" 
  },
];

function RevistaCard({ item, index }: { item: RevistaItem; index: number }) {
  const handleDownload = async () => {
    if (!item.downloadUrl) {
      toast.info("Em breve disponível para download.");
      return;
    }
    
    const toastId = toast.loading(`Baixando ${item.title}...`, {
      description: "Aguarde enquanto preparamos seu arquivo."
    });

    try {
      const response = await fetch(item.downloadUrl);
      
      if (!response.ok) throw new Error('Falha na resposta do servidor');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${item.title} - ${item.subtitle}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.dismiss(toastId);
      
      // Popup de confirmação após o download
      toast.success("Download concluído!", {
        description: "O arquivo foi salvo. Deseja abrir agora?",
        duration: 5000,
        action: {
          label: "Abrir Arquivo",
          onClick: () => {
            window.open(url, "_blank");
          }
        },
        onAutoClose: () => {
          window.URL.revokeObjectURL(url);
        }
      });
    } catch (error) {
      console.error("Erro no download:", error);
      toast.dismiss(toastId);
      
      // Se falhar o download direto (CORS), tenta abrir em nova aba como fallback
      toast.error("Não foi possível baixar automaticamente", {
        description: "Vamos abrir o arquivo em uma nova aba para você.",
        action: {
          label: "Abrir Manualmente",
          onClick: () => window.open(item.downloadUrl, "_blank")
        }
      });
      
      // Delay pequeno antes do fallback automático
      setTimeout(() => {
        window.open(item.downloadUrl, "_blank", "noopener,noreferrer");
      }, 2000);
    }
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
        {item.subtitle.includes("Professor") && (
          <Badge className="absolute top-2 left-2 gap-1 text-[10px] bg-amber-500 hover:bg-amber-600 border-none">
            <BookOpen className="h-2.5 w-2.5" /> Professor
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

  const { data: profile } = useFullProfile();
  const userClassId = profile?.class_id;

  const { data: dbMaterials, isLoading } = useQuery({
    queryKey: ["class-materials", userClassId],
    enabled: !!userClassId,
    queryFn: async () => {
      const { data } = await supabase
        .from("class_materials")
        .select("*, classes(name, cover_url)")
        .eq("class_id", userClassId!)
        .order("year", { ascending: false })
        .order("trimester", { ascending: false });
      return data ?? [];
    },
  });

  const studentsMaterials = useMemo(() => {
    const list: RevistaItem[] = []; // Inicia vazio para filtrar apenas a classe do usuário
    if (dbMaterials) {
      dbMaterials.forEach(m => {
        if (!m.title.toLowerCase().includes("professor")) {
          list.push({
            id: m.id,
            title: m.classes?.name || m.title,
            subtitle: m.title,
            cover: m.cover_url || m.classes?.cover_url || revistaAdolescentes,
            downloadUrl: m.file_url,
          });
        }
      });
    }
    return list;
  }, [dbMaterials]);

  const professorsMaterials = useMemo(() => {
    const list: RevistaItem[] = []; // Inicia vazio
    if (dbMaterials) {
      dbMaterials.forEach(m => {
        if (m.title.toLowerCase().includes("professor")) {
          list.push({
            id: m.id,
            title: m.classes?.name || m.title,
            subtitle: m.title,
            cover: m.cover_url || m.classes?.cover_url || revistaAdolescentes,
            downloadUrl: m.file_url,
          });
        }
      });
    }
    return list;
  }, [dbMaterials]);

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
              {studentsMaterials.map((item, i) => (
                <RevistaCard key={item.id} item={item} index={i} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="professores" className="mt-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {professorsMaterials.map((item, i) => (
                <RevistaCard key={item.id} item={item} index={i} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </PageShell>
    </MemberLayout>
  );
}
