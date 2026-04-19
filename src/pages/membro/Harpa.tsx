import { useMemo, useState } from "react";
import { ArrowLeft, Music2, Search } from "lucide-react";
import { MemberLayout } from "@/components/membro/MemberLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import harpaData from "@/data/harpa-crista.json";

interface Hino {
  hino: string;
  coro: string;
  verses: Record<string, string>;
}

// Build sorted list excluding metadata key "-1"
const HINOS: Array<{ number: number; title: string; data: Hino }> = Object.entries(
  harpaData as Record<string, Hino | unknown>,
)
  .filter(([k]) => /^\d+$/.test(k))
  .map(([k, v]) => {
    const data = v as Hino;
    // Strip leading "N - " from data.hino to get the title
    const title = data.hino.replace(/^\d+\s*-\s*/, "").trim();
    return { number: Number(k), title, data };
  })
  .sort((a, b) => a.number - b.number);

function renderHtml(text: string) {
  // Data uses <br> between lines; render as paragraphs with line breaks.
  return text.split(/<br\s*\/?>/i).map((line, i) => (
    <span key={i} className="block">
      {line.trim()}
    </span>
  ));
}

export default function Harpa() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<(typeof HINOS)[number] | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return HINOS;
    // If pure number, prioritize prefix match
    if (/^\d+$/.test(q)) {
      return HINOS.filter((h) => String(h.number).startsWith(q));
    }
    return HINOS.filter(
      (h) =>
        h.title.toLowerCase().includes(q) ||
        String(h.number).includes(q),
    );
  }, [search]);

  if (selected) {
    const verseEntries = Object.entries(selected.data.verses).sort(
      ([a], [b]) => Number(a) - Number(b),
    );
    return (
      <MemberLayout title={`Hino ${selected.number}`}>
        <Button
          variant="ghost"
          size="sm"
          className="mb-4"
          onClick={() => setSelected(null)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar à lista
        </Button>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Music2 className="h-5 w-5 text-primary" />
              {selected.number} — {selected.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-base leading-relaxed">
            {verseEntries.map(([num, text]) => (
              <div key={num} className="space-y-3">
                <div className="flex gap-3">
                  <span className="font-bold text-primary shrink-0">{num}.</span>
                  <div>{renderHtml(text)}</div>
                </div>
                {selected.data.coro && (
                  <div className="ml-6 italic text-muted-foreground border-l-2 border-primary/40 pl-3">
                    <span className="block font-semibold not-italic text-foreground/80 mb-1">
                      Coro
                    </span>
                    {renderHtml(selected.data.coro)}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </MemberLayout>
    );
  }

  return (
    <MemberLayout title="Harpa Cristã">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Music2 className="h-5 w-5 text-primary" /> 640 hinos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Digite o número ou título do hino"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              inputMode="text"
            />
          </div>

          <ScrollArea className="h-[60vh] rounded-md border">
            <div className="divide-y">
              {filtered.map((h) => (
                <button
                  key={h.number}
                  onClick={() => setSelected(h)}
                  className="w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors flex items-center gap-3"
                >
                  <span className="font-bold text-primary w-12 shrink-0">
                    {h.number}
                  </span>
                  <span className="truncate">{h.title}</span>
                </button>
              ))}
              {filtered.length === 0 && (
                <p className="text-muted-foreground text-sm p-4">
                  Nenhum hino encontrado.
                </p>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </MemberLayout>
  );
}
