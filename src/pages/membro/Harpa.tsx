import { useMemo, useState } from "react";
import { Music2, Search, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { MemberLayout } from "@/components/membro/MemberLayout";
import { PageShell } from "@/components/ui/page-shell";
import { PageHero } from "@/components/ui/page-hero";
import { Input } from "@/components/ui/input";
import { useHarpaData, type Hino } from "@/hooks/useHarpaData";

function renderHtml(text: string) {
  return text.split(/<br\s*\/?>/i).map((line, i) => (
    <span key={i} className="block">
      {line.trim()}
    </span>
  ));
}

interface HinoItem {
  number: number;
  title: string;
  data: Hino;
}

export default function Harpa() {
  const { data: harpaData, isLoading, isError, refetch } = useHarpaData();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<HinoItem | null>(null);

  const HINOS: HinoItem[] = useMemo(() => {
    if (!harpaData) return [];
    return Object.entries(harpaData)
      .filter(([k]) => /^\d+$/.test(k))
      .map(([k, v]) => {
        const data = v as Hino;
        const title = data.hino.replace(/^\d+\s*-\s*/, "").trim();
        return { number: Number(k), title, data };
      })
      .sort((a, b) => a.number - b.number);
  }, [harpaData]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return HINOS;
    if (/^\d+$/.test(q)) {
      return HINOS.filter((h) => String(h.number).startsWith(q));
    }
    return HINOS.filter(
      (h) => h.title.toLowerCase().includes(q) || String(h.number).includes(q),
    );
  }, [search, HINOS]);

  // Hino aberto - drill profundo, sem bottom nav
  if (selected) {
    const verseEntries = Object.entries(selected.data.verses).sort(
      ([a], [b]) => Number(a) - Number(b),
    );
    return (
      <MemberLayout
        title={`Hino ${selected.number}`}
        mobileHeader={{
          variant: "back",
          title: `${selected.number}. ${selected.title}`,
          subtitle: "Harpa Cristã",
          onBack: () => setSelected(null),
        }}
        bottomNav={false}
      >
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2 }}
          className="px-4 pt-4"
        >
        <div className="max-w-prose mx-auto space-y-6 text-[15px] leading-relaxed pb-8">
          {verseEntries.map(([num, text]) => (
            <div key={num} className="space-y-3">
              <div className="flex gap-3">
                <span className="font-bold text-primary shrink-0 tabular-nums">{num}.</span>
                <div className="text-foreground">{renderHtml(text)}</div>
              </div>
              {selected.data.coro && (
                <div className="ml-6 italic text-muted-foreground border-l-2 border-primary/40 pl-3">
                  <span className="block font-semibold not-italic text-foreground/80 mb-1 text-xs uppercase tracking-wider">
                    Coro
                  </span>
                  {renderHtml(selected.data.coro)}
                </div>
              )}
            </div>
          ))}
        </div>
        </motion.div>
      </MemberLayout>
    );
  }

  return (
    <MemberLayout
      title="Harpa"
      mobileHeader={{ variant: "back", title: "Harpa Cristã", subtitle: "640 hinos", backTo: "/" }}
    >
      <PageShell contentClassName="pb-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
        <PageHero
          eyebrow="Hinário oficial"
          title="Harpa Cristã"
          description="640 hinos para você cantar e adorar."
          Icon={Music2}
          variant="rose"
        />

        {/* Busca */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Número ou título do hino"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 rounded-xl"
            inputMode="text"
          />
        </div>

        {isError ? (
          <div className="text-center py-12 space-y-3">
            <p className="text-sm text-muted-foreground">Não conseguimos carregar a Harpa.</p>
            <button
              onClick={() => refetch()}
              className="text-sm text-primary font-semibold underline underline-offset-4"
            >
              Tentar novamente
            </button>
          </div>
        ) : isLoading ? (
          <div className="rounded-2xl border border-border bg-card divide-y divide-border overflow-hidden">
            <p className="text-xs text-muted-foreground p-3 flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Carregando hinos…
            </p>
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="px-4 py-3 flex items-center gap-3">
                <div className="h-4 w-8 rounded bg-muted animate-pulse" />
                <div className="h-4 flex-1 rounded bg-muted animate-pulse" />
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-card divide-y divide-border overflow-hidden">
            {filtered.length === 0 && (
              <p className="text-muted-foreground text-sm p-6 text-center">
                Nenhum hino encontrado.
              </p>
            )}
            {filtered.slice(0, 200).map((h) => (
              <button
                key={h.number}
                onClick={() => setSelected(h)}
                className="w-full text-left px-4 py-3 hover:bg-muted/50 active:bg-muted transition-colors flex items-center gap-3"
              >
                <span className="font-display font-extrabold text-primary w-10 shrink-0 tabular-nums text-sm">
                  {h.number}
                </span>
                <span className="truncate text-sm font-medium text-foreground">{h.title}</span>
              </button>
            ))}
            {filtered.length > 200 && (
              <p className="text-[11px] text-muted-foreground p-3 text-center">
                Mostrando 200 de {filtered.length}. Refine a busca para ver mais.
              </p>
            )}
          </div>
        )}
        </motion.div>
      </PageShell>
    </MemberLayout>
  );
}
