import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import type { ReaderMode, ReaderTheme, SyncState } from "../types/book";

interface ReaderState {
  currentBookId: string | null;
  currentPage: number;
  scrollTop: number;
  totalPages: number;
  zoom: number;
  rotation: number;
  brightness: number;
  eyeFilter: number;
  readerMode: ReaderMode;
  theme: ReaderTheme;
  isFullscreenZen: boolean;
  sidebarOpen: boolean;
  hudVisible: boolean;
  syncState: SyncState;
  lastAutosaveAt: string | null;
  setCurrentBook: (bookId: string | null) => void;
  hydrateBookState: (payload: { bookId: string | null; page?: number; scrollTop?: number; totalPages?: number }) => void;
  setPageState: (page: number, scrollTop?: number, totalPages?: number) => void;
  setZoom: (zoom: number) => void;
  setRotation: (rotation: number) => void;
  setBrightness: (brightness: number) => void;
  setEyeFilter: (eyeFilter: number) => void;
  setReaderMode: (readerMode: ReaderMode) => void;
  toggleReaderMode: () => void;
  setTheme: (theme: ReaderTheme) => void;
  toggleTheme: () => void;
  setFullscreenZen: (isFullscreenZen: boolean) => void;
  toggleSidebar: () => void;
  setHudVisible: (hudVisible: boolean) => void;
  setSyncState: (syncState: SyncState) => void;
  markAutosaved: () => void;
  resetReaderUI: () => void;
}

const readerStorage = typeof window !== "undefined" ? createJSONStorage(() => window.localStorage) : undefined;

const initialState = {
  currentBookId: null,
  currentPage: 1,
  scrollTop: 0,
  totalPages: 0,
  zoom: 1,
  rotation: 0,
  brightness: 1,
  eyeFilter: 0,
  readerMode: "single" as ReaderMode,
  theme: "day" as ReaderTheme,
  isFullscreenZen: false,
  sidebarOpen: false,
  hudVisible: true,
  syncState: "idle" as SyncState,
  lastAutosaveAt: null,
};

export const useReaderStore = create<ReaderState>()(
  persist(
    (set, get) => ({
      ...initialState,
      setCurrentBook: (bookId) =>
        set({
          currentBookId: bookId,
          currentPage: 1,
          scrollTop: 0,
          totalPages: 0,
        }),
      hydrateBookState: ({ bookId, page = 1, scrollTop = 0, totalPages = 0 }) =>
        set({
          currentBookId: bookId,
          currentPage: page,
          scrollTop,
          totalPages,
        }),
      setPageState: (page, scrollTop = get().scrollTop, totalPages = get().totalPages) =>
        set({
          currentPage: page,
          scrollTop,
          totalPages,
        }),
      setZoom: (zoom) => set({ zoom }),
      setRotation: (rotation) => set({ rotation }),
      setBrightness: (brightness) => set({ brightness }),
      setEyeFilter: (eyeFilter) => set({ eyeFilter }),
      setReaderMode: (readerMode) => set({ readerMode }),
      toggleReaderMode: () =>
        set((state) => ({
          readerMode: state.readerMode === "single" ? "double" : "single",
        })),
      setTheme: (theme) => set({ theme }),
      toggleTheme: () =>
        set((state) => ({
          theme: state.theme === "day" ? "night" : "day",
        })),
      setFullscreenZen: (isFullscreenZen) => set({ isFullscreenZen }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setHudVisible: (hudVisible) => set({ hudVisible }),
      setSyncState: (syncState) => set({ syncState }),
      markAutosaved: () => set({ lastAutosaveAt: new Date().toISOString(), syncState: "pending" }),
      resetReaderUI: () => set({ ...initialState, currentBookId: get().currentBookId }),
    }),
    {
      name: "aetherreader-reader-store",
      storage: readerStorage,
      partialize: (state) => ({
        currentBookId: state.currentBookId,
        currentPage: state.currentPage,
        scrollTop: state.scrollTop,
        totalPages: state.totalPages,
        zoom: state.zoom,
        rotation: state.rotation,
        brightness: state.brightness,
        eyeFilter: state.eyeFilter,
        readerMode: state.readerMode,
        theme: state.theme,
        isFullscreenZen: state.isFullscreenZen,
        sidebarOpen: state.sidebarOpen,
        hudVisible: state.hudVisible,
        lastAutosaveAt: state.lastAutosaveAt,
      }),
    },
  ),
);