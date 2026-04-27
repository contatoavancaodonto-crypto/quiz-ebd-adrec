import { useMemo, useState } from "react";
import { Music2, Search } from "lucide-react";
import { motion } from "framer-motion";
import { MemberLayout } from "@/components/membro/MemberLayout";
import { Input } from "@/components/ui/input";
import harpaData from "@/data/harpa-crista.json";

interface Hino {
  hino: string;
  coro: string;
  verses: Record<string, string>;
}

const HINOS: Array<{ number: number; title: string; data: Hino }> = Object.entries(
  harpaData as Record<string, Hino | unknown>,
)
  .filter(([k]) => /^\d+$/.test(k))
  .map(([k, v]) => {
    const data = v as Hino;
    const title = data.hino.replace(/^\d+\s*-\s*/, "").trim();
    return { number: Number(k), title, data };
  })
  .sort((a, b) => a.number - b.number);

function renderHtml(text: string) {
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
    if (/^\d+$/.test(q)) {
      return HINOS.filter((h) => String(h.number).startsWith(q));
    }
    return HINOS.filter(
      (h) =>
        h.title.toLowerCase().includes(q) ||
        String(h.number).includes(q),
    );
  }, [search]);

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
      </MemberLayout>
    );
  }

  return (
    <MemberLayout
      title="Harpa"
      mobileHeader={{ variant: "back", title: "Harpa Cristã", subtitle: "640 hinos", backTo: "/" }}
    >
      <div className="space-y-4 pb-4">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl bg-gradient-to-br from-rose-500 to-red-600 p-5 text-white relative overflow-hidden"
        >
          <div className="absolute -top-6 -right-6 opacity-25">
            <Music2 className="w-28 h-28" strokeWidth={1.2} />
          </div>
          <div className="relative">
            <div className="text-[10px] uppercase tracking-widest font-bold opacity-80">Hinário oficial</div>
            <h2 className="text-xl font-bold mt-1">Harpa Cristã</h2>
            <p className="text-xs opacity-90 mt-1">640 hinos para você cantar e adorar.</p>
          </div>
        </motion.div>

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
      </div>
    </MemberLayout>
  );
}
