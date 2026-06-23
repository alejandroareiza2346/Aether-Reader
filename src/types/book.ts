export type ReaderMode = "single" | "double";

export type ReaderTheme = "day" | "night";

export type SyncState = "idle" | "pending" | "syncing" | "error";

export type BookStatus = "pending" | "reading" | "paused" | "finished";

export type LibraryViewMode = "grid" | "list";

export interface Book {
  id: string;
  title: string;
  author?: string;
  fileName: string;
  filePath?: string;
  fileUrl?: string;
  totalPages?: number;
  currentPage: number;
  currentScrollTop: number;
  progress: number;
  status: BookStatus;
  lastReadAt?: string;
  createdAt: string;
  updatedAt: string;
  coverUrl?: string;
  notesCount?: number;
}

export interface ReadingProgress {
  bookId: string;
  currentPage: number;
  scrollTop: number;
  totalPages: number;
  progress: number;
  updatedAt: string;
}

export interface BookDraft {
  title: string;
  author?: string;
  fileName: string;
  filePath?: string;
  fileUrl?: string;
  totalPages?: number;
}