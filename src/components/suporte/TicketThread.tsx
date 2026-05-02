import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTicketMessages, SupportTicket } from "@/hooks/useSupportTickets";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface Props {
  ticket: SupportTicket;
  isAdmin: boolean;
}

export function TicketThread({ ticket, isAdmin }: Props) {
  const { user } = useAuth();
  const { messages, loading } = useTicketMessages(ticket.id);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  const canReply = isAdmin || ticket.status !== "closed";

  const send = async () => {
    if (!user || !body.trim()) return;
    setSending(true);
    const { error } = await (supabase as any)
      .from("support_ticket_messages")
      .insert({
        ticket_id: ticket.id,
        author_id: user.id,
        author_role: isAdmin ? "admin" : "user",
        body: body.trim(),
      });
    setSending(false);
    if (error) {
      toast.error("Falha ao enviar resposta");
      return;
    }
    setBody("");
  };

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-3 max-h-[300px] overflow-y-auto">
        {/* Mensagem inicial do ticket */}
        <MessageBubble
          fromAdmin={false}
          name={ticket.user_name ?? "Membro"}
          body={ticket.message}
          created_at={ticket.created_at}
        />
        {loading ? (
          <div className="text-xs text-muted-foreground text-center py-2">
            Carregando mensagens...
          </div>
        ) : (
          messages.map((m) => (
            <MessageBubble
              key={m.id}
              fromAdmin={m.author_role === "admin"}
              name={m.author_role === "admin" ? "Suporte" : ticket.user_name ?? "Membro"}
              body={m.body}
              created_at={m.created_at}
            />
          ))
        )}
      </div>

      {canReply ? (
        <div className="space-y-2">
          <Textarea
            placeholder={isAdmin ? "Responder ao membro..." : "Adicionar uma resposta..."}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            maxLength={2000}
          />
          <div className="flex justify-end">
            <Button onClick={send} disabled={sending || !body.trim()} size="sm">
              {sending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Enviar
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground text-center py-2">
          Este chamado foi fechado. Abra um novo se precisar de mais ajuda.
        </p>
      )}
    </div>
  );
}

function MessageBubble({
  fromAdmin,
  name,
  body,
  created_at,
}: {
  fromAdmin: boolean;
  name: string;
  body: string;
  created_at: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1", fromAdmin ? "items-start" : "items-end")}>
      <div
        className={cn(
          "max-w-[85%] rounded-lg px-3 py-2 text-sm",
          fromAdmin
            ? "bg-primary/15 border border-primary/30 text-foreground"
            : "bg-card border border-border text-foreground",
        )}
      >
        <div className="text-[10px] font-semibold uppercase tracking-wide opacity-70 mb-1">
          {fromAdmin ? "🛟 " + name : name}
        </div>
        <div className="whitespace-pre-wrap break-words">{body}</div>
      </div>
      <span className="text-[10px] text-muted-foreground">
        {formatDistanceToNow(new Date(created_at), { addSuffix: true, locale: ptBR })}
      </span>
    </div>
  );
}
