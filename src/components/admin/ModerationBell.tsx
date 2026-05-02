import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useRoles } from "@/hooks/useRoles";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export function ModerationBell() {
  const { isSuperadmin, loading } = useRoles();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (loading || !isSuperadmin) return;
    let cancelled = false;

    const refresh = async () => {
      // Count pending/blocked posts
      const { count: postsCount } = await supabase
        .from("posts")
        .select("id", { count: "exact", head: true })
        .in("status", ["pending", "blocked"]);
      
      // Count reports
      const { count: reportsCount } = await supabase
        .from("post_reports")
        .select("id", { count: "exact", head: true });

      // Count pending/blocked comments
      const { count: commentsCount } = await supabase
        .from("post_comments")
        .select("id", { count: "exact", head: true })
        .in("status", ["pending", "blocked"]);

      if (!cancelled) setCount((postsCount ?? 0) + (reportsCount ?? 0) + (commentsCount ?? 0));
    };
    refresh();

    const channel = supabase
      .channel("moderation-queue-rt")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "posts" },
        () => refresh()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "post_reports" },
        () => refresh()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "post_comments" },
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
          ? `${count} item${count === 1 ? "" : "ns"} aguardando moderação`
          : "Fila de moderação limpa"
      }
    >
      <Link to="/painel/comunidade">
        <ShieldAlert className="w-5 h-5" />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </Link>
    </Button>
  );
}
