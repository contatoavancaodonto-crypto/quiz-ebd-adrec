import { useEffect, useState } from "react";
import { resolveSupportAttachmentUrl } from "@/lib/support-attachment";
import { MemberLayout } from "@/components/membro/MemberLayout";
import { TicketForm } from "@/components/suporte/TicketForm";
import { TicketThread } from "@/components/suporte/TicketThread";
import { useSupportTickets, CATEGORY_LABELS, STATUS_LABELS, SupportTicket } from "@/hooks/useSupportTickets";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { LifeBuoy, MessageSquare } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

export default function Suporte() {
  const { tickets, loading } = useSupportTickets();
  const [selected, setSelected] = useState<SupportTicket | null>(null);
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setAttachmentUrl(null);
    if (selected?.screenshot_url) {
      resolveSupportAttachmentUrl(selected.screenshot_url).then((u) => {
        if (active) setAttachmentUrl(u);
      });
    }
    return () => { active = false; };
  }, [selected]);

  return (
    <MemberLayout title="Suporte">
      <div className="space-y-6 pb-8">
        <div className="rounded-2xl bg-gradient-to-br from-primary/15 via-primary/5 to-transparent border border-primary/20 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <LifeBuoy className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-xl font-bold">Como podemos ajudar?</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Reporte bugs, envie sugestões ou tire dúvidas. Nossa equipe responde por aqui e você
            receberá uma notificação no sino quando houver retorno.
          </p>
        </div>

        <TicketForm />

        <section className="space-y-3">
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Meus chamados
          </h2>

          {loading ? (
            <Card className="p-8 text-center text-sm text-muted-foreground">Carregando...</Card>
          ) : tickets.length === 0 ? (
            <Card className="p-8 text-center text-sm text-muted-foreground">
              Você ainda não abriu nenhum chamado.
            </Card>
          ) : (
            <div className="space-y-2">
              {tickets.map((t) => {
                const cat = CATEGORY_LABELS[t.category];
                const st = STATUS_LABELS[t.status];
                return (
                  <button
                    key={t.id}
                    onClick={() => setSelected(t)}
                    className="w-full text-left"
                  >
                    <Card className="p-4 hover:border-primary/40 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-base">{cat?.emoji}</span>
                            <span className="text-xs font-semibold text-muted-foreground">
                              {cat?.label}
                            </span>
                          </div>
                          <h3 className="font-semibold text-sm truncate">{t.subject}</h3>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                            {t.message}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <Badge className={cn("text-[10px] border", st?.tone)} variant="outline">
                            {st?.label}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">
                            {formatDistanceToNow(new Date(t.created_at), {
                              addSuffix: true,
                              locale: ptBR,
                            })}
                          </span>
                        </div>
                      </div>
                    </Card>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <Drawer open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DrawerContent className="max-h-[90vh]">
          {selected && (
            <>
              <DrawerHeader className="text-left">
                <DrawerTitle className="flex items-center gap-2">
                  <span>{CATEGORY_LABELS[selected.category]?.emoji}</span>
                  {selected.subject}
                </DrawerTitle>
                <DrawerDescription>
                  <Badge
                    className={cn("text-[10px] border mr-2", STATUS_LABELS[selected.status]?.tone)}
                    variant="outline"
                  >
                    {STATUS_LABELS[selected.status]?.label}
                  </Badge>
                  Aberto {formatDistanceToNow(new Date(selected.created_at), {
                    addSuffix: true,
                    locale: ptBR,
                  })}
                </DrawerDescription>
              </DrawerHeader>
              <div className="px-4 pb-6 overflow-y-auto">
                {selected.screenshot_url && (
                  <a
                    href={selected.screenshot_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block mb-3"
                  >
                    <img
                      src={selected.screenshot_url}
                      alt="Anexo"
                      className="rounded-lg border border-border max-h-48 object-contain"
                    />
                  </a>
                )}
                <TicketThread ticket={selected} isAdmin={false} />
              </div>
            </>
          )}
        </DrawerContent>
      </Drawer>
    </MemberLayout>
  );
}
