import { PostComposer } from "@/components/comunidade/PostComposer";
import { PostCard } from "@/components/comunidade/PostCard";
import { useCommunity } from "@/hooks/useCommunity";
import { AppHeader } from "@/components/membro/AppHeader";
import { MemberSidebar } from "@/components/membro/MemberSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Loader2, Users } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function Comunidade() {
  const { user } = useAuth();
  const { posts, loading } = useCommunity();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <MemberSidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <AppHeader firstName={user?.user_metadata?.first_name || user?.email || "Usuário"} />
          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
            <div className="max-w-2xl mx-auto">
              <div className="mb-8 flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Comunidade EBD</h1>
                <p className="text-muted-foreground">
                  Compartilhe aprendizados e interaja com seus irmãos.
                </p>
              </div>

              <PostComposer />

              <div className="space-y-4">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <Loader2 className="h-10 w-10 animate-spin text-primary/50" />
                    <p className="text-muted-foreground animate-pulse">Carregando o feed...</p>
                  </div>
                ) : posts.length > 0 ? (
                  posts.map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))
                ) : (
                  <div className="text-center py-20 bg-muted/20 rounded-xl border border-dashed">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground font-medium">Nenhuma postagem ainda.</p>
                    <p className="text-xs text-muted-foreground mt-1">Seja o primeiro a compartilhar algo!</p>
                  </div>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
