import { LibraryPage } from "./app/library/page";
import { ReaderPage } from "./app/reader/page";
import { useNavigationStore } from "./stores/useNavigationStore";

export default function App() {
  const route = useNavigationStore((state) => state.route);

  if (route === "reader") {
    return <ReaderPage />;
  }

  return <LibraryPage />;
}
