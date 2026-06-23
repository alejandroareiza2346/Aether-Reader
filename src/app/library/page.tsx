import { useMemo, useState } from "react";

import { BookGrid } from "../../components/library/BookGrid";
import { ImportDropZone } from "../../components/library/ImportDropZone";
import { buildBookDraftsFromFiles } from "../../lib/books";
import { useLibraryStore } from "../../stores/useLibraryStore";
import { useNavigationStore } from "../../stores/useNavigationStore";
import type { BookStatus } from "../../types/book";

const STATUS_OPTIONS: Array<{ value: BookStatus | "all"; label: string }> = [
  { value: "all", label: "Todos" },
  { value: "pending", label: "Pendiente" },
  { value: "reading", label: "Leyendo" },
  { value: "paused", label: "Pausado" },
  { value: "finished", label: "Terminado" },
];

export function LibraryPage() {
  const books = useLibraryStore((state) => state.books);
  const searchQuery = useLibraryStore((state) => state.searchQuery);
  const statusFilter = useLibraryStore((state) => state.statusFilter);
  const viewMode = useLibraryStore((state) => state.viewMode);
  const addBooks = useLibraryStore((state) => state.addBooks);
  const removeBook = useLibraryStore((state) => state.removeBook);
  const setSearchQuery = useLibraryStore((state) => state.setSearchQuery);
  const setStatusFilter = useLibraryStore((state) => state.setStatusFilter);
  const setViewMode = useLibraryStore((state) => state.setViewMode);
  const setActiveBookId = useLibraryStore((state) => state.setActiveBookId);
  const goToReader = useNavigationStore((state) => state.goToReader);

  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  const filteredBooks = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return books.filter((book) => {
      const matchesStatus = statusFilter === "all" || book.status === statusFilter;
      const matchesQuery =
        normalizedQuery.length === 0 ||
        book.title.toLowerCase().includes(normalizedQuery) ||
        book.fileName.toLowerCase().includes(normalizedQuery) ||
        (book.author?.toLowerCase().includes(normalizedQuery) ?? false);

      return matchesStatus && matchesQuery;
    });
  }, [books, searchQuery, statusFilter]);

  async function handleImportFiles(files: FileList | File[]): Promise<void> {
    setIsImporting(true);
    setImportError(null);

    try {
      const drafts = await buildBookDraftsFromFiles(files);
      addBooks(drafts);
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudieron importar los archivos.";
      setImportError(message);
    } finally {
      setIsImporting(false);
    }
  }

  function handleOpenBook(bookId: string): void {
    setActiveBookId(bookId);
    goToReader(bookId);
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.14),_rgba(2,6,23,0.96)_65%)] p-4 text-white">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex flex-col gap-4 rounded-[2rem] border border-white/10 bg-white/5 px-6 py-5 backdrop-blur-2xl lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">AetherReader</p>
            <h1 className="text-2xl font-semibold">Biblioteca</h1>
            <p className="mt-1 text-sm text-white/50">
              {books.length} {books.length === 1 ? "libro" : "libros"} · {filteredBooks.length} visibles
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="search"
              placeholder="Buscar por título, autor o archivo..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="min-w-[220px] flex-1 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm text-white outline-none placeholder:text-white/40 lg:flex-none lg:w-72"
            />
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as BookStatus | "all")}
              className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm text-white outline-none"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value} className="bg-slate-900">
                  {option.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm transition hover:bg-white/20"
              onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
            >
              Vista {viewMode === "grid" ? "lista" : "grid"}
            </button>
          </div>
        </header>

        <section className="mb-8">
          <ImportDropZone isImporting={isImporting} onImportFiles={(files) => void handleImportFiles(files)} />
          {importError ? (
            <p className="mt-3 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
              {importError}
            </p>
          ) : null}
        </section>

        {filteredBooks.length > 0 ? (
          <BookGrid
            books={filteredBooks}
            viewMode={viewMode}
            onOpen={handleOpenBook}
            onRemove={removeBook}
          />
        ) : (
          <div className="rounded-[2rem] border border-white/10 bg-white/5 px-6 py-16 text-center backdrop-blur-xl">
            <p className="text-lg font-medium text-white">
              {books.length === 0 ? "Tu biblioteca está vacía" : "No hay libros con esos filtros"}
            </p>
            <p className="mt-2 text-sm text-white/50">
              {books.length === 0
                ? "Importa tu primer PDF para empezar a leer."
                : "Prueba otro término de búsqueda o cambia el filtro de estado."}
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
