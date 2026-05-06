import { describe, it, expect } from 'vitest';

// Função de extração simplificada baseada na implementação do componente
const parseBibleRef = (reference: string) => {
  const ref = reference.trim();
  const match = ref.match(/^((?:\d\s+)?[^\d:]+)\s+(\d+)/);
  if (match) {
    return { book: match[1].trim(), chapter: match[2] };
  }
  const parts = ref.split(" ");
  const chapterPart = parts.pop();
  const book = parts.join(" ");
  const chapter = chapterPart?.split(":")[0];
  return { book, chapter };
};

describe('Bible Reference Parser', () => {
  it('deve extrair livro e capítulo de referências simples', () => {
    expect(parseBibleRef('João 3:16')).toEqual({ book: 'João', chapter: '3' });
    expect(parseBibleRef('Gênesis 22:7')).toEqual({ book: 'Gênesis', chapter: '22' });
  });

  it('deve lidar com livros que começam com números', () => {
    expect(parseBibleRef('1 João 5:1')).toEqual({ book: '1 João', chapter: '5' });
    expect(parseBibleRef('2 Crônicas 7:14')).toEqual({ book: '2 Crônicas', chapter: '7' });
  });

  it('deve lidar com livros de nome composto', () => {
    expect(parseBibleRef('Juízes 13')).toEqual({ book: 'Juízes', chapter: '13' });
    expect(parseBibleRef('Cantares 2:1')).toEqual({ book: 'Cantares', chapter: '2' });
  });
  
  it('deve lidar com espaços extras', () => {
    expect(parseBibleRef('  Salmos  23:1  ')).toEqual({ book: 'Salmos', chapter: '23' });
  });
});
