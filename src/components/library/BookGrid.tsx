import type { Book, LibraryViewMode } from "../../types/book";
import { BookCard } from "./BookCard";

interface BookGridProps {
  books: Book[];
  viewMode: LibraryViewMode;
  onOpen: (bookId: string) => void;
  onRemove: (bookId: string) => void;
}

export function BookGrid({ books, viewMode, onOpen, onRemove }: BookGridProps) {
  if (viewMode === "list") {
    return (
      <div className="flex flex-col gap-3">
        {books.map((book) => (
          <BookCard key={book.id} book={book} viewMode="list" onOpen={onOpen} onRemove={onRemove} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {books.map((book) => (
        <BookCard key={book.id} book={book} viewMode="grid" onOpen={onOpen} onRemove={onRemove} />
      ))}
    </div>
  );
}
