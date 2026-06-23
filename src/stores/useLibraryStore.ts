import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import type { Book, BookDraft, ReadingProgress } from "../types/book";

interface LibraryState {
  books: Book[];
  activeBookId: string | null;
  isLoading: boolean;
  syncEnabled: boolean;
  setBooks: (books: Book[]) => void;
  addBook: (draft: BookDraft) => Book;
  updateBook: (bookId: string, patch: Partial<Book>) => void;
  updateProgress: (progress: ReadingProgress) => void;
  removeBook: (bookId: string) => void;
  setActiveBookId: (bookId: string | null) => void;
  setLoading: (isLoading: boolean) => void;
  setSyncEnabled: (syncEnabled: boolean) => void;
}

const libraryStorage = typeof window !== "undefined" ? createJSONStorage(() => window.localStorage) : undefined;

function nowIso(): string {
  return new Date().toISOString();
}

function createBookId(): string {
  return crypto.randomUUID();
}

export const useLibraryStore = create<LibraryState>()(
  persist(
    (set, get) => ({
      books: [],
      activeBookId: null,
      isLoading: false,
      syncEnabled: true,
      setBooks: (books) => set({ books }),
      addBook: (draft) => {
        const book: Book = {
          id: createBookId(),
          title: draft.title,
          author: draft.author,
          fileName: draft.fileName,
          filePath: draft.filePath,
          fileUrl: draft.fileUrl,
          totalPages: draft.totalPages,
          currentPage: 1,
          currentScrollTop: 0,
          progress: 0,
          createdAt: nowIso(),
          updatedAt: nowIso(),
        };

        set((state) => ({ books: [book, ...state.books], activeBookId: book.id }));

        return book;
      },
      updateBook: (bookId, patch) =>
        set((state) => ({
          books: state.books.map((book) =>
            book.id === bookId
              ? {
                  ...book,
                  ...patch,
                  updatedAt: nowIso(),
                }
              : book,
          ),
        })),
      updateProgress: (progress) =>
        set((state) => ({
          books: state.books.map((book) =>
            book.id === progress.bookId
              ? {
                  ...book,
                  currentPage: progress.currentPage,
                  currentScrollTop: progress.scrollTop,
                  totalPages: progress.totalPages,
                  progress: progress.progress,
                  lastReadAt: progress.updatedAt,
                  updatedAt: progress.updatedAt,
                }
              : book,
          ),
        })),
      removeBook: (bookId) =>
        set((state) => ({
          books: state.books.filter((book) => book.id !== bookId),
          activeBookId: state.activeBookId === bookId ? null : state.activeBookId,
        })),
      setActiveBookId: (bookId) => set({ activeBookId: bookId }),
      setLoading: (isLoading) => set({ isLoading }),
      setSyncEnabled: (syncEnabled) => set({ syncEnabled }),
    }),
    {
      name: "aetherreader-library-store",
      storage: libraryStorage,
      partialize: (state) => ({
        books: state.books,
        activeBookId: state.activeBookId,
        syncEnabled: state.syncEnabled,
      }),
    },
  ),
);