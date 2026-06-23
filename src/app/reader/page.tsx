"use client";

import { useMemo, useState } from "react";

import { PDFReader } from "../../components/reader/PDFReader";
import { useLibraryStore } from "../../stores/useLibraryStore";
import type { Book } from "../../types/book";

function createDemoBook(): Book {
  return {
    id: "demo-book",
    title: "Demo Book",
    author: "AetherReader",
    fileName: "demo.pdf",
    fileUrl: "/sample.pdf",
    currentPage: 1,
    currentScrollTop: 0,
    progress: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export default function ReaderPage(): JSX.Element {
  const books = useLibraryStore((state) => state.books);
  const addBook = useLibraryStore((state) => state.addBook);
  const activeBookId = useLibraryStore((state) => state.activeBookId);
  const setActiveBookId = useLibraryStore((state) => state.setActiveBookId);
  const [sourceText, setSourceText] = useState("/sample.pdf");

  const activeBook = useMemo(() => {
    const existing = books.find((book) => book.id === activeBookId);
    return existing ?? books[0] ?? null;
  }, [activeBookId, books]);

  if (!activeBook && books.length === 0) {
    const seed = createDemoBook();
    addBook(seed);
    setActiveBookId(seed.id);
  }

  const selectedBook = activeBook ?? books[0] ?? createDemoBook();

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.14),_rgba(2,6,23,0.96)_65%)] p-4 text-white">
      <div className="mx-auto mb-4 flex max-w-7xl items-center justify-between rounded-3xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-2xl">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">AetherReader</p>
          <h1 className="text-xl font-semibold">Reader</h1>
        </div>
        <div className="flex items-center gap-3">
          <label className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs text-white/70">
            Fuente PDF
            <input
              className="ml-2 bg-transparent text-white outline-none"
              value={sourceText}
              onChange={(event) => setSourceText(event.target.value)}
            />
          </label>
          <button
            type="button"
            className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs transition hover:bg-white/20"
            onClick={() => addBook(createDemoBook())}
          >
            Agregar demo
          </button>
        </div>
      </div>

      <div className="mx-auto h-[calc(100vh-9rem)] max-w-7xl overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 shadow-2xl backdrop-blur-3xl">
        <PDFReader
          book={selectedBook}
          source={sourceText}
          onProgressSave={() => undefined}
          onClose={() => undefined}
        />
      </div>
    </main>
  );
}