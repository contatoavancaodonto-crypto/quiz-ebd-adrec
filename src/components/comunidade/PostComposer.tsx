import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { ImagePlus, X, Send, Sparkles, Loader2 } from "lucide-react";
import { useCommunity } from "@/hooks/useCommunity";
import { useAI } from "@/hooks/useAI";

export function PostComposer() {
  const [content, setContent] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { createPost } = useCommunity();
  const { spellCheck, checking } = useAI();

  useEffect(() => {
    if (content.trim()) {
      spellCheck(content, (corrected) => {
        // Only update if the user hasn't typed much more
        // And try to preserve cursor if possible
        const textarea = textareaRef.current;
        if (textarea) {
          const start = textarea.selectionStart;
          const end = textarea.selectionEnd;
          setContent(corrected);
          // Restore cursor position after state update (next tick)
          setTimeout(() => {
            if (textarea) {
              textarea.setSelectionRange(start, end);
            }
          }, 0);
        } else {
          setContent(corrected);
        }
      });
    }
  }, [content, spellCheck]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImage(null);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !image) return;

    setLoading(true);
    await createPost(content, image || undefined);
    setLoading(false);
    setContent("");
    removeImage();
  };

  return (
    <Card className="mb-6 overflow-hidden border-none shadow-sm ring-1 ring-border/50">
      <CardContent className="p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Textarea
              ref={textareaRef}
              placeholder="Compartilhe um aprendizado, reflexão ou mensagem..."
              className="min-h-[100px] resize-none border-none bg-muted/50 focus-visible:ring-0 focus-visible:ring-offset-0 text-base pr-10"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
            {checking && (
              <div className="absolute top-2 right-2 flex items-center gap-1.5 text-[10px] text-primary animate-pulse bg-background/50 px-2 py-1 rounded-full border border-primary/20 backdrop-blur-sm">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>IA revisando...</span>
              </div>
            )}
            {!checking && content.length > 10 && (
              <div className="absolute top-2 right-2 text-primary/40">
                <Sparkles className="h-4 w-4" />
              </div>
            )}
          </div>

          {preview && (
            <div className="relative group rounded-lg overflow-hidden border">
              <img src={preview} alt="Preview" className="w-full max-h-[300px] object-cover" />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={removeImage}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          <div className="flex items-center justify-between border-t pt-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-primary"
              onClick={() => fileInputRef.current?.click()}
            >
              <ImagePlus className="h-5 w-5 mr-2" />
              Imagem
            </Button>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleImageChange}
            />

            <Button 
              type="submit" 
              disabled={loading || (!content.trim() && !image)}
              className="rounded-full px-6"
            >
              {loading ? "Publicando..." : "Publicar"}
              <Send className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
