import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Bug, Lightbulb, HelpCircle, MessageCircle, Loader2, Paperclip, X } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { cn } from "@/lib/utils";

const schema = z.object({
  subject: z.string().trim().min(3, "Assunto muito curto").max(120),
  message: z.string().trim().min(10, "Descreva com mais detalhes").max(2000),
});

const CATEGORIES = [
  { value: "bug", label: "Bug / Erro", icon: Bug, color: "text-rose-400 border-rose-500/40 bg-rose-500/10" },
  { value: "suggestion", label: "Sugestão", icon: Lightbulb, color: "text-amber-400 border-amber-500/40 bg-amber-500/10" },
  { value: "question", label: "Dúvida", icon: HelpCircle, color: "text-blue-400 border-blue-500/40 bg-blue-500/10" },
  { value: "other", label: "Outro", icon: MessageCircle, color: "text-primary border-primary/40 bg-primary/10" },
] as const;

interface Props {
  onSubmitted?: () => void;
}

export function TicketForm({ onSubmitted }: Props) {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [category, setCategory] = useState<string>("question");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) {
      toast.error("Imagem muito grande (máx 5MB)");
      return;
    }
    setFile(f);
  };

  const submit = async () => {
    if (!user) return;
    const parsed = schema.safeParse({ subject, message });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }

    setSubmitting(true);
    let screenshot_url: string | null = null;

    if (file) {
      const ext = file.name.split(".").pop() || "png";
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("support")
        .upload(path, file, { upsert: false, contentType: file.type });
      if (upErr) {
        setSubmitting(false);
        toast.error("Falha ao enviar imagem");
        return;
      }
      const { data } = supabase.storage.from("support").getPublicUrl(path);
      screenshot_url = data.publicUrl;
    }

    const fullName = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || null;

    const { error } = await (supabase as any).from("support_tickets").insert({
      user_id: user.id,
      user_name: fullName,
      user_email: user.email ?? null,
      church_id: (profile as any)?.church_id ?? null,
      category,
      subject: subject.trim(),
      message: message.trim(),
      screenshot_url,
      page_url: category === "bug" ? window.location.href : null,
      user_agent: category === "bug" ? navigator.userAgent : null,
    });

    setSubmitting(false);

    if (error) {
      toast.error("Falha ao enviar chamado: " + error.message);
      return;
    }

    toast.success("Chamado enviado! Você receberá uma notificação quando for respondido.");
    setSubject("");
    setMessage("");
    setFile(null);
    setCategory("question");
    onSubmitted?.();
  };

  return (
    <Card className="p-5 space-y-5">
      <div className="space-y-2">
        <Label>Tipo de chamado</Label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {CATEGORIES.map((c) => {
            const Icon = c.icon;
            const active = category === c.value;
            return (
              <button
                key={c.value}
                type="button"
                onClick={() => setCategory(c.value)}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-lg border-2 p-3 transition-all",
                  active
                    ? c.color + " scale-[1.02]"
                    : "border-border bg-muted/30 text-muted-foreground hover:border-primary/30",
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-semibold">{c.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="ticket-subject">Assunto *</Label>
        <Input
          id="ticket-subject"
          placeholder="Resumo curto do que aconteceu"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          maxLength={120}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="ticket-message">Descrição *</Label>
        <Textarea
          id="ticket-message"
          placeholder={
            category === "bug"
              ? "O que você estava fazendo? O que esperava acontecer? O que aconteceu?"
              : "Conte com detalhes para podermos ajudar melhor"
          }
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={5}
          maxLength={2000}
        />
        <div className="text-right text-[10px] text-muted-foreground">
          {message.length}/2000
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="ticket-file">Anexar print (opcional)</Label>
        {file ? (
          <div className="flex items-center justify-between gap-2 rounded-md border border-border bg-muted/40 px-3 py-2">
            <span className="text-xs truncate flex-1">{file.name}</span>
            <Button variant="ghost" size="icon" onClick={() => setFile(null)} className="h-7 w-7">
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <label
            htmlFor="ticket-file"
            className="flex items-center gap-2 cursor-pointer rounded-md border border-dashed border-border px-3 py-2 text-xs text-muted-foreground hover:border-primary/50 hover:bg-muted/30 transition-colors"
          >
            <Paperclip className="w-4 h-4" />
            Selecionar imagem (máx 5MB)
            <input
              id="ticket-file"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFile}
            />
          </label>
        )}
      </div>

      <div className="flex justify-end">
        <Button onClick={submit} disabled={submitting}>
          {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Enviar chamado
        </Button>
      </div>
    </Card>
  );
}
