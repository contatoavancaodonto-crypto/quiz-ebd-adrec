import { useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ParsedQuestion {
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: string;
  explanation: string | null;
}

interface ParseResult {
  ok: ParsedQuestion[];
  errors: { block: number; reason: string }[];
}

const EXAMPLE = `P: Quem escreveu o Pentateuco?
A: Davi
B: Moisés
C: Salomão
D: Paulo
R: B
E: Os cinco primeiros livros da Bíblia são atribuídos a Moisés.
---
P: Em qual cidade Jesus nasceu?
A: Nazaré
B: Jerusalém
C: Belém
D: Cafarnaum
R: C`;

function parseTxt(text: string): ParseResult {
  const blocks = text.split(/\n\s*-{3,}\s*\n/).map((b) => b.trim()).filter(Boolean);
  const ok: ParsedQuestion[] = [];
  const errors: ParseResult["errors"] = [];

  blocks.forEach((block, idx) => {
    const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
    const fields: Record<string, string> = {};
    let currentKey: string | null = null;

    for (const line of lines) {
      const m = line.match(/^([PABCDRE]):\s*(.*)$/i);
      if (m) {
        currentKey = m[1].toUpperCase();
        fields[currentKey] = m[2];
      } else if (currentKey) {
        fields[currentKey] += " " + line;
      }
    }

    const required = ["P", "A", "B", "C", "D", "R"];
    const missing = required.filter((k) => !fields[k]);
    if (missing.length) {
      errors.push({ block: idx + 1, reason: `Campos faltando: ${missing.join(", ")}` });
      return;
    }
    const correct = fields.R.trim().toUpperCase();
    if (!["A", "B", "C", "D"].includes(correct)) {
      errors.push({ block: idx + 1, reason: `Resposta inválida: ${fields.R}` });
      return;
    }
    ok.push({
      question_text: fields.P.trim(),
      option_a: fields.A.trim(),
      option_b: fields.B.trim(),
      option_c: fields.C.trim(),
      option_d: fields.D.trim(),
      correct_option: correct,
      explanation: fields.E ? fields.E.trim() : null,
    });
  });

  return { ok, errors };
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  quizId: string;
  startOrder: number;
  onImported: () => void;
}

export function BulkQuestionImportDialog({ open, onOpenChange, quizId, startOrder, onImported }: Props) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const preview = text.trim() ? parseTxt(text) : { ok: [], errors: [] };

  const handleImport = async () => {
    if (!preview.ok.length) {
      return toast.error("Nenhuma pergunta válida para importar.");
    }
    setBusy(true);
    const rows = preview.ok.map((q, i) => ({
      ...q,
      quiz_id: quizId,
      order_index: startOrder + i,
    }));
    const { error } = await supabase.from("questions").insert(rows);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(`${rows.length} pergunta(s) importada(s)`);
    setText("");
    onOpenChange(false);
    onImported();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Importar perguntas em lote (TXT)</DialogTitle>
          <DialogDescription>
            Cole as perguntas no formato abaixo. Separe cada pergunta com uma linha contendo apenas <code>---</code>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="rounded-md bg-muted/50 p-3 text-xs font-mono whitespace-pre-wrap text-muted-foreground">
            {EXAMPLE}
          </div>
          <div>
            <Label>Conteúdo</Label>
            <Textarea
              rows={12}
              className="font-mono text-xs"
              placeholder="Cole aqui as perguntas no formato P:/A:/B:/C:/D:/R:/E:"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>
          {text.trim() && (
            <div className="text-sm">
              <span className="text-primary font-medium">{preview.ok.length} válida(s)</span>
              {preview.errors.length > 0 && (
                <span className="text-destructive font-medium ml-3">
                  {preview.errors.length} com erro
                </span>
              )}
              {preview.errors.length > 0 && (
                <ul className="mt-2 list-disc list-inside text-xs text-destructive">
                  {preview.errors.map((e) => (
                    <li key={e.block}>Bloco {e.block}: {e.reason}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>Cancelar</Button>
          <Button onClick={handleImport} disabled={busy || !preview.ok.length}>
            Importar {preview.ok.length || ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
