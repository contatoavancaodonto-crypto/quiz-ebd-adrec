import { describe, it, expect } from 'vitest';

const normalizeBibleKey = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toLowerCase();

const parseBibleRef = (reference: string) => {
  const ref = reference.trim().replace(/\s+/g, ' ');
  const match = ref.match(/^(.*?)\s+(\d+)(?:[.:](\d+))?$/);

  if (!match) return null;

  return {
    book: match[1].trim(),
    chapter: match[2],
    verse: match[3] ?? null,
  };
};

const resolveBibleBook = (
  books: Array<{ name: string; abbrev: string }>,
  rawBook: string
) => {
  const normalizedQuery = normalizeBibleKey(rawBook);

  return (
    books.find((book) => normalizeBibleKey(book.name) === normalizedQuery) ||
    books.find((book) => normalizeBibleKey(book.abbrev) === normalizedQuery)
  );
};

describe('Bible reference parsing and resolution', () => {
  const books = [
    { abbrev: 'Hb', name: 'Hebreus' },
    { abbrev: 'Gn', name: 'Gênesis' },
    { abbrev: 'Rm', name: 'Romanos' },
    { abbrev: 'Jo', name: 'João' },
    { abbrev: '1Jo', name: '1 João' },
    { abbrev: '2Cr', name: '2 Crônicas' },
  ];

  it('extrai livro, capítulo e versículo com ponto', () => {
    expect(parseBibleRef('Hb 11.6')).toEqual({ book: 'Hb', chapter: '11', verse: '6' });
    expect(parseBibleRef('Gn 22.7')).toEqual({ book: 'Gn', chapter: '22', verse: '7' });
  });

  it('extrai livro, capítulo e versículo com dois-pontos e nome completo', () => {
    expect(parseBibleRef('João 3:16')).toEqual({ book: 'João', chapter: '3', verse: '16' });
    expect(parseBibleRef('Hebreus 11:6')).toEqual({ book: 'Hebreus', chapter: '11', verse: '6' });
  });

  it('lida com livros numerados abreviados e completos', () => {
    expect(parseBibleRef('1 Jo 5.1')).toEqual({ book: '1 Jo', chapter: '5', verse: '1' });
    expect(parseBibleRef('2 Crônicas 7:14')).toEqual({ book: '2 Crônicas', chapter: '7', verse: '14' });
  });

  it('resolve livros por abreviação, nome completo e sem acento', () => {
    expect(resolveBibleBook(books, 'Hb')).toEqual({ abbrev: 'Hb', name: 'Hebreus' });
    expect(resolveBibleBook(books, 'Hebreus')).toEqual({ abbrev: 'Hb', name: 'Hebreus' });
    expect(resolveBibleBook(books, 'Genesis')).toEqual({ abbrev: 'Gn', name: 'Gênesis' });
    expect(resolveBibleBook(books, 'Joao')).toEqual({ abbrev: 'Jo', name: 'João' });
  });

  it('resolve abreviações numeradas sem espaço', () => {
    expect(resolveBibleBook(books, '1Jo')).toEqual({ abbrev: '1Jo', name: '1 João' });
    expect(resolveBibleBook(books, '2Cr')).toEqual({ abbrev: '2Cr', name: '2 Crônicas' });
  });
});
