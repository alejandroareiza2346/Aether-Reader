import { create } from "zustand";

export type AppRoute = "library" | "reader";

interface NavigationState {
  route: AppRoute;
  readerBookId: string | null;
  goToLibrary: () => void;
  goToReader: (bookId: string) => void;
}

export const useNavigationStore = create<NavigationState>((set) => ({
  route: "library",
  readerBookId: null,
  goToLibrary: () => set({ route: "library", readerBookId: null }),
  goToReader: (bookId) => set({ route: "reader", readerBookId: bookId }),
}));
