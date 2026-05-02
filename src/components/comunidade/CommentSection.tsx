import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2 } from "lucide-react";
import { usePostComments } from "@/hooks/usePostComments";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface CommentSectionProps {
  postId: string;
  isAdminView?: boolean;
}

export function CommentSection({ postId, isAdminView = false }: CommentSectionProps) {
  const { user } = useAuth();
  const { comments, loading, addComment, deleteComment } = usePostComments(postId);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmitting(true);
    await addComment(newComment);
    setNewComment("");
    setSubmitting(false);
  };

  return (
    <div className="bg-muted/30 border-t p-4 space-y-4">
      {loading ? (
        <div className="text-center py-2 text-xs text-muted-foreground">Carregando comentários...</div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <Avatar className="h-8 w-8 border">
                <AvatarImage src={comment.author?.avatar_url || undefined} />
                <AvatarFallback>{comment.author?.first_name?.[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="bg-background rounded-2xl px-4 py-2 ring-1 ring-border/50">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-semibold text-xs">
                      {comment.author?.display_name || `${comment.author?.first_name} ${comment.author?.last_name}`}
                    </span>
                    {(user?.id === comment.user_id || isAdminView) && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                        onClick={() => deleteComment(comment.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  <p className="text-sm leading-relaxed">{comment.content}</p>
                </div>
                <span className="text-[10px] text-muted-foreground ml-2 mt-1 block">
                  {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: ptBR })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2 items-center pt-2">
        <Avatar className="h-8 w-8 border">
          <AvatarImage src={user?.user_metadata?.avatar_url} />
          <AvatarFallback>{user?.email?.[0].toUpperCase()}</AvatarFallback>
        </Avatar>
        <Input
          placeholder="Escreva um comentário..."
          className="rounded-full bg-background border-none ring-1 ring-border/50 focus-visible:ring-primary h-9"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
        />
        <Button 
          type="submit" 
          disabled={submitting || !newComment.trim()} 
          size="sm" 
          className="rounded-full px-4"
        >
          Enviar
        </Button>
      </form>
    </div>
  );
}
