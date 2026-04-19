import { useMemo, useState } from "react";
import { ArrowLeft, BookOpen, Search } from "lucide-react";
import { MemberLayout } from "@/components/membro/MemberLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

  // Step 3: verses
  if (selectedBook && selectedChapter !== null) {
    const verses = selectedBook.chapters[selectedChapter];
    return (
      <MemberLayout title={`${selectedBook.name} ${selectedChapter + 1}`}>
        <Button
          variant="ghost"
          size="sm"
          className="mb-4"
          onClick={() => setSelectedChapter(null)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar aos capítulos
        </Button>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              {selectedBook.name} — Capítulo {selectedChapter + 1}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 leading-relaxed text-base">
            {verses.map((verse, i) => (
              <p key={i} className="flex gap-2">
                <span className="font-bold text-primary shrink-0 min-w-[1.75rem]">
                  {i + 1}
                </span>
                <span>{verse}</span>
              </p>
            ))}
          </CardContent>
        </Card>
      </MemberLayout>
    );
  }

  // Step 2: chapters grid
  if (selectedBook) {
    return (
      <MemberLayout title={selectedBook.name}>
        <Button
          variant="ghost"
          size="sm"
          className="mb-4"
          onClick={() => setSelectedBook(null)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar aos livros
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>Selecione o capítulo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
              {selectedBook.chapters.map((_, i) => (
                <Button
                  key={i}
                  variant="outline"
                  className="h-12"
                  onClick={() => setSelectedChapter(i)}
                >
                  {i + 1}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </MemberLayout>
    );
  }

  // Step 1: book list
  const renderBooks = (list: Book[]) => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
      {list.map((book) => (
        <Button
          key={book.abbrev}
          variant="outline"
          className="justify-start h-auto py-3"
          onClick={() => setSelectedBook(book)}
        >
          <span className="truncate">{book.name}</span>
        </Button>
      ))}
      {list.length === 0 && (
        <p className="text-muted-foreground col-span-full text-sm">
          Nenhum livro encontrado.
        </p>
      )}
    </div>
  );

  return (
    <MemberLayout title="Bíblia Online">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" /> Almeida Corrigida Fiel
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar livro..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <Tabs defaultValue="at" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="at">Antigo Testamento</TabsTrigger>
              <TabsTrigger value="nt">Novo Testamento</TabsTrigger>
            </TabsList>
            <TabsContent value="at" className="mt-4">
              {renderBooks(filteredOT)}
            </TabsContent>
            <TabsContent value="nt" className="mt-4">
              {renderBooks(filteredNT)}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </MemberLayout>
  );
}
