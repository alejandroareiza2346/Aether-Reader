import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import type { Book, BookDraft, BookStatus, LibraryViewMode, ReadingProgress } from "../types/book";

interface LibraryState {
  books: Book[];
  activeBookId: string | null;
  isLoading: boolean;
  syncEnabled: boolean;
  searchQuery: string;
  statusFilter: BookStatus | "all";
  viewMode: LibraryViewMode;
  setBooks: (books: Book[]) => void;
  addBook: (draft: BookDraft) => Book;
  addBooks: (drafts: BookDraft[]) => Book[];
  updateBook: (bookId: string, patch: Partial<Book>) => void;
  updateProgress: (progress: ReadingProgress) => void;
  removeBook: (bookId: string) => void;
  setActiveBookId: (bookId: string | null) => void;
  setLoading: (isLoading: boolean) => void;
  setSyncEnabled: (syncEnabled: boolean) => void;
  setSearchQuery: (searchQuery: string) => void;
  setStatusFilter: (statusFilter: BookStatus | "all") => void;
  setViewMode: (viewMode: LibraryViewMode) => void;
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
    (set) => ({
      books: [],
      activeBookId: null,
      isLoading: false,
      syncEnabled: true,
      searchQuery: "",
      statusFilter: "all",
      viewMode: "grid",
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
          status: "pending",
          createdAt: nowIso(),
          updatedAt: nowIso(),
        };

        set((state) => ({ books: [book, ...state.books], activeBookId: book.id }));

        return book;
      },
      addBooks: (drafts) => {
        const books = drafts.map((draft) => ({
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
          status: "pending" as const,
          createdAt: nowIso(),
          updatedAt: nowIso(),
        }));

        set((state) => ({ books: [...books, ...state.books] }));

        return books;
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
                  status: progress.progress >= 99.5 ? "finished" : progress.currentPage > 1 ? "reading" : book.status,
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
      setSearchQuery: (searchQuery) => set({ searchQuery }),
      setStatusFilter: (statusFilter) => set({ statusFilter }),
      setViewMode: (viewMode) => set({ viewMode }),
    }),
    {
      name: "aetherreader-library-store",
      storage: libraryStorage,
      version: 1,
      migrate: (persistedState) => {
        const state = persistedState as LibraryState;
        return {
          ...state,
          books: state.books.map((book) => ({
            ...book,
            status: book.status ?? "pending",
          })),
          viewMode: state.viewMode ?? "grid",
          statusFilter: state.statusFilter ?? "all",
          searchQuery: state.searchQuery ?? "",
        };
      },
      partialize: (state) => ({
        books: state.books,
        activeBookId: state.activeBookId,
        syncEnabled: state.syncEnabled,
        viewMode: state.viewMode,
      }),
    },
  ),
);