import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useRoles } from "@/hooks/useRoles";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export function PendingRequestsBell() {
  const { isSuperadmin, loading } = useRoles();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (loading || !isSuperadmin) return;
    let cancelled = false;

    const refresh = async () => {
      const [
        { count: editReqs }, 
        { count: newChurches }, 
        { count: openTickets }
      ] = await Promise.all([
        supabase
          .from("church_edit_requests")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending"),
        supabase
          .from("churches")
          .select("id", { count: "exact", head: true })
          .eq("approved", false)
          .eq("requested", true),
        supabase
          .from("support_tickets")
          .select("id", { count: "exact", head: true })
          .eq("status", "open")
      ]);
      if (!cancelled) setCount((editReqs ?? 0) + (newChurches ?? 0) + (openTickets ?? 0));
    };
    refresh();

    const channel = supabase
      .channel("pending-requests-global-rt")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "church_edit_requests" },
        () => refresh()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "churches" },
        () => refresh()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "support_tickets" },
        () => refresh()
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [isSuperadmin, loading]);

  if (loading || !isSuperadmin) return null;

  return (
    <Button
      asChild
      variant="ghost"
      size="icon"
      className="relative"
      title={
        count > 0
          ? `${count} pendência${count === 1 ? "" : "s"} aguardando atenção`
          : "Tudo em dia!"
      }
    >
      <Link to="/painel">
        <Bell className="w-5 h-5 text-foreground" />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </Link>
    </Button>
  );
}
