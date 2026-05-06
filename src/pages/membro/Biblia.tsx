import { useMemo, useState, useEffect, useRef } from "react";
import { BookOpen, Search, Loader2, ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { MemberLayout } from "@/components/membro/MemberLayout";
import { PageShell } from "@/components/ui/page-shell";
import { PageHero } from "@/components/ui/page-hero";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useBibliaData, type BibliaBook } from "@/hooks/useBibliaData";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const OT_COUNT = 39;

const normalizeBibleKey = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toLowerCase();

const resolveBibleBook = (books: BibliaBook[], rawBook: string) => {
  const normalizedQuery = normalizeBibleKey(rawBook);

  return (
    books.find((book) => normalizeBibleKey(book.name) === normalizedQuery) ||
    books.find((book) => normalizeBibleKey(book.abbrev) === normalizedQuery)
  );
};

export default function Biblia() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { data: BOOKS, isLoading, isError, refetch } = useBibliaData();
  const [selectedBook, setSelectedBook] = useState<BibliaBook | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const activeVerseRef = useRef<HTMLParagraphElement | null>(null);

  const deepLinkBook = searchParams.get("book");
  const deepLinkChapter = searchParams.get("chapter");
  const deepLinkVerse = searchParams.get("verse");

  useEffect(() => {
    if (!BOOKS || !deepLinkBook) return;

    const book = resolveBibleBook(BOOKS, decodeURIComponent(deepLinkBook));
    const chapterNum = Number.parseInt(deepLinkChapter || "1", 10);

    if (!book) return;

    setSelectedBook(book);

    if (!Number.isNaN(chapterNum) && chapterNum > 0 && chapterNum <= book.chapters.length) {
      setSelectedChapter(chapterNum - 1);
    }
  }, [BOOKS, deepLinkBook, deepLinkChapter]);

  useEffect(() => {
    if (!selectedBook || selectedChapter === null || !deepLinkVerse || !activeVerseRef.current) return;

    const timer = window.setTimeout(() => {
      activeVerseRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 150);

    return () => window.clearTimeout(timer);
  }, [selectedBook, selectedChapter, deepLinkVerse]);

  const handleNextChapter = () => {
    if (selectedBook && selectedChapter !== null && selectedChapter < selectedBook.chapters.length - 1) {
      setSelectedChapter(selectedChapter + 1);
      setSearchParams({ 
        book: selectedBook.abbrev, 
        chapter: (selectedChapter + 2).toString() 
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePrevChapter = () => {
    if (selectedBook && selectedChapter !== null && selectedChapter > 0) {
      setSelectedChapter(selectedChapter - 1);
      setSearchParams({ 
        book: selectedBook.abbrev, 
        chapter: (selectedChapter).toString() 
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const highlightedVerse = Number.parseInt(deepLinkVerse || "", 10);

  const { OLD_TESTAMENT, NEW_TESTAMENT } = useMemo(() => {
    if (!BOOKS) return { OLD_TESTAMENT: [] as BibliaBook[], NEW_TESTAMENT: [] as BibliaBook[] };
    return {
      OLD_TESTAMENT: BOOKS.slice(0, OT_COUNT),
      NEW_TESTAMENT: BOOKS.slice(OT_COUNT),
    };
  }, [BOOKS]);

  const filterBooks = (list: BibliaBook[]) =>
    !search.trim()
      ? list
      : list.filter((b) => b.name.toLowerCase().includes(search.toLowerCase()));

  const filteredOT = useMemo(() => filterBooks(OLD_TESTAMENT), [search, OLD_TESTAMENT]);
  const filteredNT = useMemo(() => filterBooks(NEW_TESTAMENT), [search, NEW_TESTAMENT]);

  const BibleStickyHeader = ({ 
    title, 
    subtitle, 
    onBack, 
    onNext, 
    onPrev,
    hasNext,
    hasPrev 
  }: { 
    title: string; 
    subtitle: string; 
    onBack: () => void;
    onNext?: () => void;
    onPrev?: () => void;
    hasNext?: boolean;
    hasPrev?: boolean;
  }) => (
    <header 
      className="md:hidden sticky top-0 z-30 bg-background/90 backdrop-blur-xl border-b border-border/50"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="flex items-center justify-between px-4 h-14 gap-2">
        <button
          onClick={onBack}
          aria-label="Voltar"
          className="w-10 h-10 -ml-2 rounded-full hover:bg-muted flex items-center justify-center text-foreground active:scale-95 transition-transform shrink-0"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        
        <div className="flex-1 flex items-center justify-center gap-1 overflow-hidden">
          {onPrev && (
            <button
              onClick={onPrev}
              disabled={!hasPrev}
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-90 shrink-0",
                hasPrev ? "text-primary hover:bg-primary/10" : "text-muted-foreground/30"
              )}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}

          <div className="flex-1 min-w-0 text-center px-1">
            <h1 className="text-base font-bold text-foreground truncate leading-tight">
              {title}
            </h1>
            <p className="text-[10px] text-muted-foreground truncate leading-tight font-medium uppercase tracking-wider">
              {subtitle}
            </p>
          </div>

          {onNext && (
            <button
              onClick={onNext}
              disabled={!hasNext}
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-90 shrink-0",
                hasNext ? "text-primary hover:bg-primary/10" : "text-muted-foreground/30"
              )}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>
        
        <div className="w-10 shrink-0" />
      </div>
    </header>
  );

  if (selectedBook && selectedChapter !== null) {
    const verses = selectedBook.chapters[selectedChapter];
    return (
      <MemberLayout
        title={`${selectedBook.name} ${selectedChapter + 1}`}
        mobileHeader={{ variant: "none" }}
        bottomNav={false}
        contentPaddingMobile={false}
      >
        <BibleStickyHeader
          title={selectedBook.name}
          subtitle={`Capítulo ${selectedChapter + 1}`}
          onBack={() => {
            setSelectedChapter(null);
            setSearchParams({ book: selectedBook.abbrev });
          }}
          onNext={handleNextChapter}
          onPrev={handlePrevChapter}
          hasNext={selectedChapter < selectedBook.chapters.length - 1}
          hasPrev={selectedChapter > 0}
        />
        
        <div className="space-y-3 pb-8 px-4 pt-4 max-w-prose mx-auto leading-relaxed text-[15px]">
          {verses.map((verse, i) => {
            const verseNumber = i + 1;
            const isHighlighted = verseNumber === highlightedVerse;

            return (
              <p
                key={i}
                ref={isHighlighted ? activeVerseRef : null}
                className={cn(
                  "flex gap-2.5 rounded-xl px-3 py-2 transition-all",
                  isHighlighted && "bg-primary/10 ring-1 ring-primary/30 shadow-sm"
                )}
              >
                <span className="font-bold text-primary shrink-0 min-w-[1.75rem] tabular-nums text-sm pt-0.5">
                  {verseNumber}
                </span>
                <span className="text-foreground">{verse}</span>
              </p>
            );
          })}
        </div>
      </MemberLayout>
    );
  }

  if (selectedBook) {
    return (
      <MemberLayout
        title={selectedBook.name}
        mobileHeader={{ variant: "none" }}
        contentPaddingMobile={false}
      >
        <BibleStickyHeader
          title={selectedBook.name}
          subtitle={`${selectedBook.chapters.length} capítulos`}
          onBack={() => {
            setSelectedBook(null);
            setSearchParams({});
          }}
        />

        <div className="space-y-4 px-4 pt-4">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
            Selecione o capítulo
          </div>
          <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
            {selectedBook.chapters.map((_, i) => (
              <motion.button
                key={i}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setSelectedChapter(i);
                  setSearchParams({ book: selectedBook.abbrev, chapter: (i + 1).toString() });
                }}
                className="aspect-square rounded-xl bg-card border border-border font-semibold text-sm hover:border-primary hover:bg-primary/5 transition-colors"
              >
                {i + 1}
              </motion.button>
            ))}
          </div>
        </div>
      </MemberLayout>
    );
  }

  const renderBooks = (list: BibliaBook[]) => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
      {list.map((book, i) => (
        <motion.button
          key={book.abbrev}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: Math.min(i * 0.01, 0.2) }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setSelectedBook(book)}
          className="text-left rounded-xl bg-card border border-border px-3 py-3 text-sm font-medium hover:border-primary hover:bg-primary/5 transition-colors active:scale-[0.98]"
        >
          <span className="truncate block">{book.name}</span>
          <span className="text-[10px] text-muted-foreground">{book.chapters.length} cap.</span>
        </motion.button>
      ))}
      {list.length === 0 && (
        <p className="text-muted-foreground col-span-full text-sm text-center py-6">
          Nenhum livro encontrado.
        </p>
      )}
    </div>
  );

  const renderSkeleton = () => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="h-[58px] rounded-xl bg-card border border-border animate-pulse"
        />
      ))}
    </div>
  );

  return (
    <MemberLayout
      title="Bíblia"
      mobileHeader={{ variant: "back", title: "Bíblia Online", subtitle: "Almeida Corrigida Fiel", backTo: "/" }}
    >
      <PageShell contentClassName="pb-4">
        <PageHero
          eyebrow="Almeida Corrigida Fiel"
          title="Bíblia Sagrada"
          description="66 livros · Antigo e Novo Testamento."
          Icon={BookOpen}
          variant="primary"
        />

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar livro..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 rounded-xl"
          />
        </div>

        {isError ? (
          <div className="text-center py-12 space-y-3">
            <p className="text-sm text-muted-foreground">Não conseguimos carregar a Bíblia.</p>
            <button
              onClick={() => refetch()}
              className="text-sm text-primary font-semibold underline underline-offset-4"
            >
              Tentar novamente
            </button>
          </div>
        ) : (
          <Tabs defaultValue="at" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="at">Antigo Test.</TabsTrigger>
              <TabsTrigger value="nt">Novo Test.</TabsTrigger>
            </TabsList>
            <TabsContent value="at" className="mt-4">
              {isLoading ? (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Carregando livros…
                  </p>
                  {renderSkeleton()}
                </div>
              ) : (
                renderBooks(filteredOT)
              )}
            </TabsContent>
            <TabsContent value="nt" className="mt-4">
              {isLoading ? renderSkeleton() : renderBooks(filteredNT)}
            </TabsContent>
          </Tabs>
        )}
      </PageShell>
    </MemberLayout>
  );
}
