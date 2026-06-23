import { useMemo } from "react";

import { PDFReader } from "../../components/reader/PDFReader";
import { useLibraryStore } from "../../stores/useLibraryStore";
import { useNavigationStore } from "../../stores/useNavigationStore";

export function ReaderPage() {
  const books = useLibraryStore((state) => state.books);
  const readerBookId = useNavigationStore((state) => state.readerBookId);
  const goToLibrary = useNavigationStore((state) => state.goToLibrary);

  const selectedBook = useMemo(() => {
    if (readerBookId) {
      return books.find((book) => book.id === readerBookId) ?? null;
    }

    return books[0] ?? null;
  }, [books, readerBookId]);

  if (!selectedBook) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-white">
        <div className="max-w-md rounded-[2rem] border border-white/10 bg-white/5 p-8 text-center backdrop-blur-2xl">
          <h1 className="text-xl font-semibold">No hay libro seleccionado</h1>
          <p className="mt-2 text-sm text-white/60">Importa un PDF desde la biblioteca para empezar a leer.</p>
          <button
            type="button"
            className="mt-6 rounded-full border border-white/10 bg-white/10 px-5 py-2 text-sm transition hover:bg-white/20"
            onClick={goToLibrary}
          >
            Volver a biblioteca
          </button>
        </div>
      </main>
    );
  }

  const source = selectedBook.fileUrl ?? selectedBook.filePath;

  if (!source) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-white">
        <div className="max-w-md rounded-[2rem] border border-white/10 bg-white/5 p-8 text-center backdrop-blur-2xl">
          <h1 className="text-xl font-semibold">Archivo no disponible</h1>
          <p className="mt-2 text-sm text-white/60">
            No se encontró la fuente del PDF para <strong>{selectedBook.title}</strong>.
          </p>
          <button
            type="button"
            className="mt-6 rounded-full border border-white/10 bg-white/10 px-5 py-2 text-sm transition hover:bg-white/20"
            onClick={goToLibrary}
          >
            Volver a biblioteca
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.14),_rgba(2,6,23,0.96)_65%)] p-4 text-white">
      <div className="mx-auto mb-4 flex max-w-7xl items-center justify-between rounded-3xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-2xl">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">Lectura</p>
          <h1 className="text-xl font-semibold">{selectedBook.title}</h1>
        </div>
        <button
          type="button"
          className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs transition hover:bg-white/20"
          onClick={goToLibrary}
        >
          ← Biblioteca
        </button>
      </div>

      <div className="mx-auto h-[calc(100vh-9rem)] max-w-7xl overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 shadow-2xl backdrop-blur-3xl">
        <PDFReader book={selectedBook} source={source} onClose={goToLibrary} />
      </div>
    </main>
  );
}
