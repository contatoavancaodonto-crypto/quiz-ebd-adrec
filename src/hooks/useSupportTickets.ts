import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface SupportTicket {
  id: string;
  user_id: string;
  user_name: string | null;
  user_email: string | null;
  church_id: string | null;
  category: "bug" | "suggestion" | "question" | "other";
  priority: "low" | "normal" | "high";
  subject: string;
  message: string;
  screenshot_url: string | null;
  page_url: string | null;
  user_agent: string | null;
  status: "open" | "in_progress" | "resolved" | "closed";
  admin_response: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SupportMessage {
  id: string;
  ticket_id: string;
  author_id: string;
  author_role: "user" | "admin";
  body: string;
  created_at: string;
}

/**
 * Hook genérico que carrega tickets segundo as RLS:
 * - Para membros: só vê os próprios.
 * - Para superadmin: vê todos.
 */
export function useSupportTickets() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setTickets([]);
      setLoading(false);
      return;
    }
    const { data } = await (supabase as any)
      .from("support_tickets")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    setTickets((data ?? []) as SupportTicket[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("support-tickets-rt")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "support_tickets" },
        () => refresh(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, refresh]);

  return { tickets, loading, refresh };
}

export function useTicketMessages(ticketId: string | null) {
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!ticketId) {
      setMessages([]);
      setLoading(false);
      return;
    }
    const { data } = await (supabase as any)
      .from("support_ticket_messages")
      .select("*")
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true });
    setMessages((data ?? []) as SupportMessage[]);
    setLoading(false);
  }, [ticketId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!ticketId) return;
    const channel = supabase
      .channel(`ticket-msgs-${ticketId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "support_ticket_messages",
          filter: `ticket_id=eq.${ticketId}`,
        },
        () => refresh(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [ticketId, refresh]);

  return { messages, loading, refresh };
}

export const CATEGORY_LABELS: Record<string, { label: string; emoji: string }> = {
  bug: { label: "Bug / Erro", emoji: "🐛" },
  suggestion: { label: "Sugestão", emoji: "💡" },
  question: { label: "Dúvida", emoji: "❓" },
  other: { label: "Outro", emoji: "💬" },
};

export const STATUS_LABELS: Record<string, { label: string; tone: string }> = {
  open: { label: "Aberto", tone: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
  in_progress: { label: "Em andamento", tone: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  resolved: { label: "Resolvido", tone: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  closed: { label: "Fechado", tone: "bg-muted text-muted-foreground border-border" },
};

export const PRIORITY_LABELS: Record<string, { label: string; tone: string }> = {
  low: { label: "Baixa", tone: "bg-muted text-muted-foreground" },
  normal: { label: "Normal", tone: "bg-secondary text-secondary-foreground" },
  high: { label: "Alta", tone: "bg-destructive/15 text-destructive border-destructive/30" },
};
