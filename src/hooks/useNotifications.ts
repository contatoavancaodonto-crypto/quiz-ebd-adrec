import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface AppNotification {
  id: string;
  title: string;
  body: string | null;
  link: string | null;
  source: string;
  scope: string;
  scope_id: string | null;
  created_at: string;
  read: boolean;
}

/**
 * Carrega últimas notificações relevantes ao usuário (global + da turma dele)
 * + status de leitura. Atualiza em tempo real.
 */
export function useNotifications(limit = 30) {
  const { user } = useAuth();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }

    // Pega class_id do usuário p/ filtrar notificações de turma
    const { data: profile } = await supabase
      .from("profiles")
      .select("class_id, church_id")
      .eq("id", user.id)
      .maybeSingle();

    const classId = (profile as any)?.class_id ?? null;
    const churchId = (profile as any)?.church_id ?? null;

    // Busca notificações: global OU (scope=class e scope_id=class do user) OU (scope=church e scope_id=church do user)
    const { data: notifs } = await (supabase as any)
      .from("notifications")
      .select("id, title, body, link, source, scope, scope_id, created_at")
      .order("created_at", { ascending: false })
      .limit(limit);

    const filtered = (notifs ?? []).filter((n: any) => {
      if (n.scope === "global") return true;
      if (n.scope === "class" && classId && n.scope_id === classId) return true;
      if (n.scope === "church" && churchId && n.scope_id === churchId) return true;
      return false;
    });

    const ids = filtered.map((n: any) => n.id);
    let readSet = new Set<string>();
    if (ids.length > 0) {
      const { data: reads } = await (supabase as any)
        .from("notification_reads")
        .select("notification_id")
        .eq("user_id", user.id)
        .in("notification_id", ids);
      readSet = new Set((reads ?? []).map((r: any) => r.notification_id));
    }

    setItems(
      filtered.map((n: any) => ({ ...n, read: readSet.has(n.id) })),
    );
    setLoading(false);
  }, [user, limit]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Realtime: novas notificações ou novas leituras
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("notifications-rt")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications" },
        () => refresh(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notification_reads", filter: `user_id=eq.${user.id}` },
        () => refresh(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, refresh]);

  const markAsRead = useCallback(
    async (id: string) => {
      if (!user) return;
      // Otimista
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
      await (supabase as any)
        .from("notification_reads")
        .upsert({ notification_id: id, user_id: user.id }, { onConflict: "notification_id,user_id" });
    },
    [user],
  );

  const markAllAsRead = useCallback(async () => {
    if (!user) return;
    const unread = items.filter((n) => !n.read);
    if (unread.length === 0) return;
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    await (supabase as any)
      .from("notification_reads")
      .upsert(
        unread.map((n) => ({ notification_id: n.id, user_id: user.id })),
        { onConflict: "notification_id,user_id" },
      );
  }, [user, items]);

  const unreadCount = items.filter((n) => !n.read).length;

  return { items, loading, unreadCount, markAsRead, markAllAsRead, refresh };
}
