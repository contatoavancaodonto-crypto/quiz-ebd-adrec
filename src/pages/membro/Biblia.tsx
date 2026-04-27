import { useMemo, useState } from "react";
import { BookOpen, Search } from "lucide-react";
import { motion } from "framer-motion";
import { MemberLayout } from "@/components/membro/MemberLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import bibliaData from "@/data/biblia-acf.json";

interface Book {
  abbrev: string;
  name: string;
  chapters: string[][];
}

const BOOKS = bibliaData as Book[];
const OT_COUNT = 39;
const OLD_TESTAMENT = BOOKS.slice(0, OT_COUNT);
const NEW_TESTAMENT = BOOKS.slice(OT_COUNT);

export default function Biblia() {
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  const filterBooks = (list: Book[]) =>
    !search.trim()
      ? list
      : list.filter((b) => b.name.toLowerCase().includes(search.toLowerCase()));

  const filteredOT = useMemo(() => filterBooks(OLD_TESTAMENT), [search]);
  const filteredNT = useMemo(() => filterBooks(NEW_TESTAMENT), [search]);

  // Step 3: verses (drill profundo - sem bottom nav)
  if (selectedBook && selectedChapter !== null) {
    const verses = selectedBook.chapters[selectedChapter];
    return (
      <MemberLayout
        title={`${selectedBook.name} ${selectedChapter + 1}`}
        mobileHeader={{
          variant: "back",
          title: selectedBook.name,
          subtitle: `Capítulo ${selectedChapter + 1}`,
          onBack: () => setSelectedChapter(null),
        }}
        bottomNav={false}
      >
        <div className="space-y-3 pb-8 max-w-prose mx-auto leading-relaxed text-[15px]">
          {verses.map((verse, i) => (
            <p key={i} className="flex gap-2.5">
              <span className="font-bold text-primary shrink-0 min-w-[1.75rem] tabular-nums text-sm pt-0.5">
                {i + 1}
              </span>
              <span className="text-foreground">{verse}</span>
            </p>
          ))}
        </div>
      </MemberLayout>
    );
  }

  // Step 2: chapters grid
  if (selectedBook) {
    return (
      <MemberLayout
        title={selectedBook.name}
        mobileHeader={{
          variant: "back",
          title: selectedBook.name,
          subtitle: `${selectedBook.chapters.length} capítulos`,
          onBack: () => setSelectedBook(null),
        }}
      >
        <div className="space-y-4">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
            Selecione o capítulo
          </div>
          <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
            {selectedBook.chapters.map((_, i) => (
              <motion.button
                key={i}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedChapter(i)}
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

  // Step 1: book list
  const renderBooks = (list: Book[]) => (
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

  return (
    <MemberLayout
      title="Bíblia"
      mobileHeader={{ variant: "back", title: "Bíblia Online", subtitle: "Almeida Corrigida Fiel", backTo: "/" }}
    >
      <div className="space-y-4 pb-4">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl bg-gradient-to-br from-indigo-500 to-blue-600 p-5 text-white relative overflow-hidden"
        >
          <div className="absolute -top-6 -right-6 opacity-25">
            <BookOpen className="w-28 h-28" strokeWidth={1.2} />
          </div>
          <div className="relative">
            <div className="text-[10px] uppercase tracking-widest font-bold opacity-80">Almeida Corrigida Fiel</div>
            <h2 className="text-xl font-bold mt-1">Bíblia Sagrada</h2>
            <p className="text-xs opacity-90 mt-1">66 livros · Antigo e Novo Testamento</p>
          </div>
        </motion.div>

        {/* Busca */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar livro..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 rounded-xl"
          />
        </div>

        <Tabs defaultValue="at" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="at">Antigo Test.</TabsTrigger>
            <TabsTrigger value="nt">Novo Test.</TabsTrigger>
          </TabsList>
          <TabsContent value="at" className="mt-4">
            {renderBooks(filteredOT)}
          </TabsContent>
          <TabsContent value="nt" className="mt-4">
            {renderBooks(filteredNT)}
          </TabsContent>
        </Tabs>
      </div>
    </MemberLayout>
  );
}
