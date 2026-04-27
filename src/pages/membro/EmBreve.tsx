import { Sparkles } from "lucide-react";
import { MemberLayout } from "@/components/membro/MemberLayout";
import { PageShell } from "@/components/ui/page-shell";
import { PageHero } from "@/components/ui/page-hero";

interface EmBreveProps {
  title: string;
  description: string;
}

export function EmBreve({ title, description }: EmBreveProps) {
  return (
    <MemberLayout
      title={title}
      mobileHeader={{ variant: "back", title, backTo: "/" }}
    >
      <PageShell>
        <PageHero
          eyebrow="Em breve"
          title={title}
          description={description}
          Icon={Sparkles}
          variant="secondary"
        />
      </PageShell>
    </MemberLayout>
  );
}
