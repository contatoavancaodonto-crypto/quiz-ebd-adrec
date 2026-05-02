import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { PostCard } from "@/components/comunidade/PostCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, 
  ShieldAlert, 
  MessageSquare, 
  ListFilter, 
  Trash2, 
  ShieldCheck, 
  AlertTriangle, 
  ShieldX,
  Clock
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function AdminCommunity() {
  const [posts, setPosts] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [moderationQueue, setModerationQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch ALL posts including deleted ones
      const { data: postsData } = await supabase
        .from("posts")
        .select(`
          *,
          author:profiles(
            display_name,
            first_name,
            last_name,
            avatar_url,
            church:churches(name)
          ),
          likes:post_likes(user_id),
          comments:post_comments(id, deleted)
        `)
        .order("created_at", { ascending: false });

      // Fetch reports
      const { data: reportsData } = await supabase
        .from("post_reports")
        .select(`
          *,
          reporter:profiles(display_name, first_name, last_name),
          post:posts(
            *,
            author:profiles(display_name, first_name, last_name)
          )
        `)
        .order("created_at", { ascending: false });

      // Fetch pending/blocked content for moderation queue
      const { data: queueData } = await supabase
        .from("posts")
        .select(`
          *,
          author:profiles(
            display_name,
            first_name,
            last_name,
            avatar_url,
            church:churches(name)
          )
        `)
        .in("status", ["pending", "blocked"])
        .order("created_at", { ascending: false });

      const formattedPosts = (postsData || []).map((p: any) => ({
        ...p,
        author: {
          ...p.author,
          church_name: p.author?.church?.name
        },
        likes_count: p.likes?.length || 0,
        comments_count: p.comments?.filter((c: any) => !c.deleted).length || 0,
        user_has_liked: false
      }));

      setPosts(formattedPosts);
      setReports(reportsData || []);
      setModerationQueue(queueData || []);
    } catch (error) {
      console.error("Error fetching admin community data:", error);
      toast.error("Erro ao carregar dados de moderação");
    } finally {
      setLoading(false);
    }
  };

  const approveContent = async (id: string) => {
    try {
      const { error } = await supabase
        .from("posts")
        .update({ status: "approved" })
        .eq("id", id);
      if (error) throw error;
      toast.success("Conteúdo aprovado");
      fetchData();
    } catch (error) {
      toast.error("Erro ao aprovar conteúdo");
    }
  };

  const blockContent = async (id: string) => {
    try {
      const { error } = await supabase
        .from("posts")
        .update({ status: "blocked" })
        .eq("id", id);
      if (error) throw error;
      toast.success("Conteúdo bloqueado");
      fetchData();
    } catch (error) {
      toast.error("Erro ao bloquear conteúdo");
    }
  };

  useEffect(() => {
    fetchData();

    // Listen for changes in posts (status changes or new posts) and reports
    const postsChannel = supabase
      .channel("admin-community-rt")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "posts" },
        () => fetchData()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "post_reports" },
        () => fetchData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(postsChannel);
    };
  }, []);

  const deletePermanently = async (postId: string) => {
    if (!confirm("Tem certeza que deseja excluir PERMANENTEMENTE esta postagem? Esta ação não pode ser desfeita.")) return;
    try {
      const { error } = await supabase.from("posts").delete().eq("id", postId);
      if (error) throw error;
      toast.success("Postagem excluída permanentemente");
      fetchData();
    } catch (error) {
      toast.error("Erro ao excluir permanentemente");
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar />
        <main className="flex-1 p-6 lg:p-10 overflow-y-auto">
          <div className="max-w-6xl mx-auto">
            <header className="mb-8 flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Moderação de Comunidade</h1>
                <p className="text-muted-foreground">Gerencie postagens, comentários e denúncias.</p>
              </div>
              <Button variant="outline" onClick={fetchData} size="sm">
                Atualizar
              </Button>
            </header>

            <Tabs defaultValue="moderation" className="space-y-6">
              <TabsList className="bg-muted/50 p-1">
                <TabsTrigger value="moderation" className="gap-2">
                  <ShieldCheck className="h-4 w-4" />
                  Fila de Moderação (IA)
                  {moderationQueue.length > 0 && (
                    <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center rounded-full bg-amber-100 text-amber-700">
                      {moderationQueue.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="reports" className="gap-2">
                  <ShieldAlert className="h-4 w-4" />
                  Denúncias
                  {reports.length > 0 && (
                    <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center rounded-full">
                      {reports.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="posts" className="gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Todas as Postagens
                </TabsTrigger>
              </TabsList>

              <TabsContent value="moderation" className="space-y-4">
                {loading ? (
                  <div className="flex justify-center py-20"><Loader2 className="animate-spin" /></div>
                ) : moderationQueue.length > 0 ? (
                  <div className="grid gap-6">
                    {moderationQueue.map((item) => (
                      <Card key={item.id} className={cn(
                        "overflow-hidden border-none shadow-sm ring-1 ring-border/50",
                        item.status === "blocked" ? "opacity-75 bg-destructive/5" : ""
                      )}>
                        <div className={cn(
                          "px-4 py-2 text-[10px] font-bold uppercase tracking-wider flex items-center justify-between",
                          item.status === "pending" ? "bg-amber-100 text-amber-700" : "bg-destructive text-destructive-foreground"
                        )}>
                          <span className="flex items-center gap-1.5">
                            {item.status === "pending" ? <Clock className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                            Status IA: {item.status === "pending" ? "Pendente / Em Análise" : "Bloqueado"}
                          </span>
                          <span>Nível de Risco: {item.risk_level || "Não informado"}</span>
                        </div>
                        <div className="p-4 flex gap-4">
                          <Avatar className="h-10 w-10 border">
                            <AvatarImage src={item.author?.avatar_url || undefined} />
                            <AvatarFallback>{item.author?.first_name?.[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 space-y-3">
                            <div>
                              <div className="font-semibold text-sm">
                                {item.author?.display_name || `${item.author?.first_name} ${item.author?.last_name}`}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {format(new Date(item.created_at), "dd/MM HH:mm", { locale: ptBR })} • {item.author?.church?.name}
                              </div>
                            </div>
                            
                            <div className="bg-muted/30 p-3 rounded-lg border border-dashed text-sm italic">
                              {item.content}
                              {item.image_url && (
                                <img src={item.image_url} alt="Post" className="mt-2 rounded max-h-40 w-auto object-cover" />
                              )}
                            </div>

                            {item.moderation_reason && (
                              <div className="text-xs text-destructive flex items-start gap-1.5 bg-destructive/5 p-2 rounded">
                                <ShieldX className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                                <span><strong>Motivo IA:</strong> {item.moderation_reason}</span>
                              </div>
                            )}

                            <div className="flex justify-end gap-2 pt-2">
                              <Button variant="outline" size="sm" className="text-destructive" onClick={() => deletePermanently(item.id)}>
                                <Trash2 className="h-4 w-4 mr-2" /> Excluir Permanente
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => blockContent(item.id)}>
                                <AlertTriangle className="h-4 w-4 mr-2" /> Bloquear
                              </Button>
                              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => approveContent(item.id)}>
                                <ShieldCheck className="h-4 w-4 mr-2" /> Aprovar Conteúdo
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20 bg-muted/20 rounded-xl border border-dashed">
                    <ShieldCheck className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                    <p className="text-muted-foreground">Fila de moderação limpa. Nenhum conteúdo suspeito detectado pela IA.</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="reports" className="space-y-4">
                {loading ? (
                  <div className="flex justify-center py-20"><Loader2 className="animate-spin" /></div>
                ) : reports.length > 0 ? (
                  <div className="grid gap-4">
                    {reports.map((report) => (
                      <Card key={report.id} className="border-l-4 border-l-destructive">
                        <CardHeader className="p-4 pb-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <Badge variant="outline" className="mb-2">Denúncia #{report.id.slice(0, 8)}</Badge>
                              <CardTitle className="text-sm">
                                Motivo: <span className="font-bold text-destructive">{report.reason || "Não especificado"}</span>
                              </CardTitle>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(report.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                            </span>
                          </div>
                        </CardHeader>
                        <CardContent className="p-4 pt-2 space-y-3">
                          <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                            Denunciado por: <strong>{report.reporter?.display_name || report.reporter?.first_name}</strong>
                          </div>
                          <div className="border rounded-lg p-3 bg-muted/20">
                            <div className="text-xs font-bold mb-1">Conteúdo Denunciado:</div>
                            <p className="text-sm italic">"{report.post?.content || "Sem texto"}"</p>
                            <div className="mt-2 text-[10px] text-muted-foreground">
                              Autor: {report.post?.author?.display_name || report.post?.author?.first_name}
                            </div>
                          </div>
                          <div className="flex justify-end gap-2 pt-2">
                            <Button variant="outline" size="sm" onClick={() => deletePermanently(report.post_id)}>
                              <Trash2 className="h-4 w-4 mr-2" /> Excluir Postagem
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20 bg-muted/20 rounded-xl border border-dashed">
                    <p className="text-muted-foreground">Nenhuma denúncia pendente.</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="posts" className="space-y-4">
                <div className="max-w-2xl mx-auto space-y-4">
                  {loading ? (
                    <div className="flex justify-center py-20"><Loader2 className="animate-spin" /></div>
                  ) : posts.length > 0 ? (
                    posts.map((post) => (
                      <PostCard key={post.id} post={post} isAdminView={true} />
                    ))
                  ) : (
                    <div className="text-center py-20">Sem postagens.</div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
