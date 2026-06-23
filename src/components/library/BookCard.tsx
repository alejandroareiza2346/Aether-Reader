import type { Book } from "../../types/book";
import { formatRelativeDate, STATUS_LABELS } from "../../lib/books";

interface BookCardProps {
  book: Book;
  viewMode: "grid" | "list";
  onOpen: (bookId: string) => void;
  onRemove: (bookId: string) => void;
}

function ProgressBar({ progress }: { progress: number }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
      <div
        className="h-full rounded-full bg-sky-400/80 transition-all duration-300"
        style={{ width: `${Math.min(progress, 100)}%` }}
      />
    </div>
  );
}

export function BookCard({ book, viewMode, onOpen, onRemove }: BookCardProps) {
  const statusLabel = STATUS_LABELS[book.status] ?? book.status;

  if (viewMode === "list") {
    return (
      <article className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl transition hover:border-white/20 hover:bg-white/10">
        <div className="flex h-16 w-12 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-gradient-to-br from-sky-500/20 to-indigo-500/20 text-xs font-semibold uppercase text-white/70">
          PDF
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-base font-semibold text-white">{book.title}</h3>
            <span className="rounded-full border border-white/10 bg-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-white/60">
              {statusLabel}
            </span>
          </div>
          <p className="truncate text-sm text-white/50">{book.author ?? book.fileName}</p>
          <div className="mt-2 max-w-xs">
            <ProgressBar progress={book.progress} />
          </div>
          <p className="mt-1 text-xs text-white/40">
            {book.progress.toFixed(0)}% · {formatRelativeDate(book.lastReadAt)}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2 opacity-0 transition group-hover:opacity-100">
          <button
            type="button"
            className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs text-white transition hover:bg-white/20"
            onClick={() => onOpen(book.id)}
          >
            Abrir
          </button>
          <button
            type="button"
            className="rounded-full border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-xs text-rose-100 transition hover:bg-rose-500/20"
            onClick={() => onRemove(book.id)}
          >
            Eliminar
          </button>
        </div>
      </article>
    );
  }

  return (
    <article className="group flex flex-col overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/5 backdrop-blur-xl transition hover:-translate-y-1 hover:border-white/20 hover:bg-white/10">
      <div className="relative flex aspect-[3/4] items-center justify-center bg-gradient-to-br from-slate-800/80 via-sky-900/40 to-indigo-900/60">
        <span className="text-4xl font-bold tracking-tight text-white/20">PDF</span>
        <span className="absolute left-3 top-3 rounded-full border border-white/10 bg-black/30 px-2 py-1 text-[10px] uppercase tracking-wider text-white/70 backdrop-blur-md">
          {statusLabel}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <h3 className="line-clamp-2 text-base font-semibold text-white">{book.title}</h3>
          <p className="mt-1 truncate text-sm text-white/50">{book.author ?? book.fileName}</p>
        </div>
        <ProgressBar progress={book.progress} />
        <p className="text-xs text-white/40">
          Pág. {book.currentPage}
          {book.totalPages ? ` / ${book.totalPages}` : ""} · {book.progress.toFixed(0)}%
        </p>
        <div className="mt-auto flex gap-2">
          <button
            type="button"
            className="flex-1 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-medium text-white transition hover:bg-white/20"
            onClick={() => onOpen(book.id)}
          >
            {book.progress > 0 ? "Continuar" : "Leer"}
          </button>
          <button
            type="button"
            aria-label={`Eliminar ${book.title}`}
            className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/60 transition hover:border-rose-400/30 hover:bg-rose-500/10 hover:text-rose-100"
            onClick={() => onRemove(book.id)}
          >
            ×
          </button>
        </div>
      </div>
    </article>
  );
}
