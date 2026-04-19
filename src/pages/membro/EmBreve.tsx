import { Sparkles } from "lucide-react";
import { MemberLayout } from "@/components/membro/MemberLayout";
import { Card, CardContent } from "@/components/ui/card";

interface EmBreveProps {
  title: string;
  description: string;
}

export function EmBreve({ title, description }: EmBreveProps) {
  return (
    <MemberLayout title={title}>
      <Card>
        <CardContent className="pt-12 pb-12 flex flex-col items-center text-center gap-4">
          <div className="p-4 rounded-full bg-primary/10">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-xl font-bold">Em breve</h2>
          <p className="text-muted-foreground max-w-md">{description}</p>
        </CardContent>
      </Card>
    </MemberLayout>
  );
}

export const Harpa = () => (
  <EmBreve
    title="Harpa Cristã"
    description="Em breve você terá acesso a todos os hinos da Harpa Cristã, com busca por número e letra completa."
  />
);
