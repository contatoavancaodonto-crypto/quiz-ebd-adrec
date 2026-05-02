import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { 
  Heart, 
  MessageCircle, 
  MoreVertical, 
  Flag, 
  Trash2, 
  Edit2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ShieldCheck
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Post, useCommunity } from "@/hooks/useCommunity";
import { useAuth } from "@/hooks/useAuth";
import { CommentSection } from "./CommentSection";
import { ReportModal } from "./ReportModal";
import { cn } from "@/lib/utils";

interface PostCardProps {
  post: Post;
  isAdminView?: boolean;
}

export function PostCard({ post, isAdminView = false }: PostCardProps) {
  const { user } = useAuth();
  const { toggleLike, deletePost, updatePost } = useCommunity();
  const [showComments, setShowComments] = useState(false);
  const [isReporting, setIsReporting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content || "");
  const [showReportSuccess, setShowReportSuccess] = useState(false);

  const isAuthor = user?.id === post.user_id;
  const canEdit = isAuthor && (new Date().getTime() - new Date(post.created_at).getTime() < 3600000);

  const handleToggleLike = () => {
    toggleLike(post.id, post.user_has_liked);
  };

  const handleUpdate = async () => {
    if (!editContent.trim()) return;
    await updatePost(post.id, editContent);
    setIsEditing(false);
  };

  const handleReported = () => {
    setShowReportSuccess(true);
    setTimeout(() => setShowReportSuccess(false), 5000);
  };

  return (
    <Card className={cn(
      "mb-4 overflow-hidden border-none shadow-sm ring-1 ring-border/50",
      post.deleted && "opacity-60 bg-muted/20 grayscale-[0.3]"
    )}>
      <CardHeader className="p-4 pb-2 flex-row items-center justify-between space-y-0">
        <div className="flex items-center space-x-3">
          <Avatar className="h-10 w-10 border">
            <AvatarImage src={post.author?.avatar_url || undefined} />
            <AvatarFallback>{post.author?.first_name?.[0]}{post.author?.last_name?.[0]}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-semibold text-sm leading-none flex items-center gap-1">
              {post.author?.display_name || `${post.author?.first_name} ${post.author?.last_name}`}
              {post.deleted && <span className="text-[10px] bg-destructive/10 text-destructive px-1.5 py-0.5 rounded ml-2 uppercase font-bold">Excluído</span>}
            </span>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <span>{post.author?.church_name}</span>
              <span className="mx-1">•</span>
              <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: ptBR })}</span>
            </div>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {canEdit && (
              <DropdownMenuItem onClick={() => setIsEditing(true)}>
                <Edit2 className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
            )}
            {(isAuthor || isAdminView) && !post.deleted && (
              <DropdownMenuItem 
                className="text-destructive focus:text-destructive" 
                onClick={() => deletePost(post.id)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Remover
              </DropdownMenuItem>
            )}
            {!isAuthor && !post.deleted && (
              <DropdownMenuItem onClick={() => setIsReporting(true)}>
                <Flag className="mr-2 h-4 w-4" />
                Denunciar
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>

      <CardContent className="p-4 pt-2">
        {isEditing ? (
          <div className="space-y-2">
            <textarea
              className="w-full min-h-[100px] p-3 rounded-lg bg-muted/50 border-none focus:ring-1 focus:ring-primary outline-none"
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>Cancelar</Button>
              <Button size="sm" onClick={handleUpdate}>Salvar</Button>
            </div>
          </div>
        ) : (
          <>
            {post.content && <p className="text-base whitespace-pre-wrap mb-4">{post.content}</p>}
            {post.image_url && (
              <div className="rounded-lg overflow-hidden border bg-muted/30 mb-2">
                <img 
                  src={post.image_url} 
                  alt="Post" 
                  className="w-full max-h-[500px] object-contain mx-auto" 
                />
              </div>
            )}
          </>
        )}
      </CardContent>

      <CardFooter className="p-2 border-t flex items-center gap-1">
        <Button 
          variant="ghost" 
          size="sm" 
          className={cn(
            "flex-1 gap-2 text-muted-foreground",
            post.user_has_liked && "text-red-500 hover:text-red-600 hover:bg-red-50"
          )}
          onClick={handleToggleLike}
          disabled={post.deleted}
        >
          <Heart className={cn("h-4 w-4", post.user_has_liked && "fill-current")} />
          <span>{post.likes_count > 0 && post.likes_count} Curtir</span>
        </Button>

        <Button 
          variant="ghost" 
          size="sm" 
          className="flex-1 gap-2 text-muted-foreground"
          onClick={() => setShowComments(!showComments)}
          disabled={post.deleted && !isAdminView}
        >
          <MessageCircle className="h-4 w-4" />
          <span>{post.comments_count > 0 && post.comments_count} Comentar</span>
        </Button>
      </CardFooter>

      {showComments && (
        <CommentSection postId={post.id} isAdminView={isAdminView} />
      )}

      <ReportModal 
        isOpen={isReporting} 
        onClose={() => setIsReporting(false)} 
        postId={post.id} 
        onSuccess={handleReported}
      />

      {showReportSuccess && (
        <div className="bg-emerald-50 text-emerald-700 px-4 py-3 border-y border-emerald-100 flex items-center gap-3 animate-in slide-in-from-bottom duration-300">
          <CheckCircle2 className="h-5 w-5" />
          <span className="text-sm font-medium">Obrigado pela denúncia. Nosso time vai analisar rapidamente.</span>
        </div>
      )}
    </Card>
  );
}
