import { useEffect, useMemo, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import type { PDFDocumentProxy, PDFPageProxy, RenderTask } from "pdfjs-dist";

import { clamp, ensurePdfWorker, formatProgress } from "../../lib/pdf";
import { useLibraryStore } from "../../stores/useLibraryStore";
import { useReaderStore } from "../../stores/useReaderStore";
import type { Book } from "../../types/book";

interface PDFReaderProps {
  book: Book;
  source: string | ArrayBuffer;
  onProgressSave?: (bookId: string, page: number, scrollTop: number, totalPages: number, progress: number) => Promise<void> | void;
  onClose?: () => void;
}

interface PageRenderResult {
  pageNumber: number;
  canvas: HTMLCanvasElement;
  container: HTMLDivElement;
}

const AUTOSAVE_INTERVAL = 3000;

async function renderPdfPage(options: {
  pdf: PDFDocumentProxy;
  pageNumber: number;
  container: HTMLDivElement;
  scale: number;
  rotation: number;
  brightness: number;
  eyeFilter: number;
}): Promise<PageRenderResult> {
  const { pdf, pageNumber, container, scale, rotation, brightness, eyeFilter } = options;
  const page = (await pdf.getPage(pageNumber)) as PDFPageProxy;
  const viewport = page.getViewport({ scale, rotation });

  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("No se pudo crear el contexto 2D del canvas.");
  }

  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);
  canvas.className = "block h-auto w-full rounded-3xl shadow-2xl";
  canvas.style.filter = `brightness(${brightness}) saturate(${1 + eyeFilter}) contrast(${1 + eyeFilter * 0.25})`;

  const renderTask = page.render({ canvasContext: context, viewport });
  await renderTask.promise;

  container.replaceChildren(canvas);

  return { pageNumber, canvas, container };
}

export function PDFReader({ book, source, onProgressSave, onClose }: PDFReaderProps) {
  const readerState = useReaderStore();
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageContainers, setPageContainers] = useState<HTMLDivElement[]>([]);
  const [hoverHud, setHoverHud] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(readerState.sidebarOpen);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const autosaveRef = useRef<number | null>(null);
  const renderTaskRef = useRef<RenderTask | null>(null);
  const mountedRef = useRef(true);

  const isDoublePage = readerState.readerMode === "double";
  const zoom = clamp(readerState.zoom, 0.5, 3);
  const brightness = clamp(readerState.brightness, 0.5, 2);
  const eyeFilter = clamp(readerState.eyeFilter, 0, 1.5);
  const totalPages = pdf?.numPages ?? book.totalPages ?? 0;
  const currentPage = clamp(readerState.currentPage, 1, Math.max(totalPages, 1));
  const progress = formatProgress(currentPage, totalPages);

  const pageRange = useMemo(() => {
    if (isDoublePage) {
      return [currentPage, clamp(currentPage + 1, 1, Math.max(totalPages, 1))].filter((page, index, pages) => pages.indexOf(page) === index);
    }

    return [currentPage];
  }, [currentPage, isDoublePage, totalPages]);

  useEffect(() => {
    ensurePdfWorker();
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    let cancelled = false;

    async function loadDocument(): Promise<void> {
      try {
        setLoading(true);
        setError(null);

        const loadingTask = pdfjsLib.getDocument({
          url: typeof source === "string" ? source : undefined,
          data: source instanceof ArrayBuffer ? source : undefined,
          useWorkerFetch: true,
        });

        const documentProxy = await loadingTask.promise;

        if (cancelled) {
          await documentProxy.destroy();
          return;
        }

        setPdf(documentProxy);
        useReaderStore.getState().hydrateBookState({
          bookId: book.id,
          page: book.currentPage || 1,
          scrollTop: book.currentScrollTop || 0,
          totalPages: documentProxy.numPages,
        });
        useLibraryStore.getState().updateBook(book.id, { totalPages: documentProxy.numPages });
      } catch (loadError) {
        if (!cancelled) {
          const message = loadError instanceof Error ? loadError.message : "No se pudo cargar el PDF.";
          setError(message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadDocument();

    return () => {
      cancelled = true;
      mountedRef.current = false;
    };
  }, [book.id, source]);

  useEffect(() => {
    setSidebarOpen(readerState.sidebarOpen);
  }, [readerState.sidebarOpen]);

  useEffect(() => {
    if (!pdf) {
      return;
    }

    const activePdf = pdf;
    const pagesToRender = pageRange;
    const containers = pageContainers;

    if (containers.length < pagesToRender.length) {
      return;
    }

    let cancelled = false;

    async function paintPages(): Promise<void> {
      for (let index = 0; index < pagesToRender.length; index += 1) {
        const pageNumber = pagesToRender[index];
        const container = containers[index];

        if (!container || cancelled) {
          continue;
        }

        try {
          renderTaskRef.current?.cancel();
          await renderPdfPage({
            pdf: activePdf,
            pageNumber,
            container,
            scale: zoom,
            rotation: readerState.rotation,
            brightness,
            eyeFilter,
          });
        } catch (renderError) {
          if (!cancelled) {
            const message = renderError instanceof Error ? renderError.message : "No se pudo renderizar la página.";
            setError(message);
          }
        }
      }
    }

    void paintPages();

    return () => {
      cancelled = true;
    };
  }, [brightness, eyeFilter, pageContainers, pageRange, pdf, readerState.rotation, zoom]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (!pdf) {
        return;
      }

      const updatedProgress = formatProgress(currentPage, totalPages);
      const scrollTop = viewportRef.current?.scrollTop ?? readerState.scrollTop;

      useReaderStore.getState().markAutosaved();
      useLibraryStore.getState().updateProgress({
        bookId: book.id,
        currentPage,
        scrollTop,
        totalPages,
        progress: updatedProgress,
        updatedAt: new Date().toISOString(),
      });

      void onProgressSave?.(book.id, currentPage, scrollTop, totalPages, updatedProgress);
    }, AUTOSAVE_INTERVAL);

    autosaveRef.current = timer;

    return () => {
      window.clearInterval(timer);
      autosaveRef.current = null;
    };
  }, [book.id, currentPage, onProgressSave, pdf, readerState.scrollTop, totalPages]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === "ArrowRight") {
        event.preventDefault();
        goToNextPage();
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goToPreviousPage();
      }

      if (event.key === "Escape") {
        useReaderStore.getState().setFullscreenZen(false);
        setSidebarOpen(false);
        onClose?.();
      }

      if (event.key.toLowerCase() === "f") {
        useReaderStore.getState().toggleTheme();
      }

      if (event.key.toLowerCase() === "z") {
        useReaderStore.getState().setFullscreenZen(!readerState.isFullscreenZen);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, readerState.isFullscreenZen]);

  function syncCurrentPage(nextPage: number): void {
    const normalizedPage = clamp(nextPage, 1, Math.max(totalPages, 1));
    const updatedScrollTop = viewportRef.current?.scrollTop ?? readerState.scrollTop;
    const updatedProgress = formatProgress(normalizedPage, totalPages);

    useReaderStore.getState().hydrateBookState({
      bookId: book.id,
      page: normalizedPage,
      scrollTop: updatedScrollTop,
      totalPages,
    });
    useReaderStore.getState().setPageState(normalizedPage, updatedScrollTop, totalPages);
    useLibraryStore.getState().updateProgress({
      bookId: book.id,
      currentPage: normalizedPage,
      scrollTop: updatedScrollTop,
      totalPages,
      progress: updatedProgress,
      updatedAt: new Date().toISOString(),
    });

    void onProgressSave?.(book.id, normalizedPage, updatedScrollTop, totalPages, updatedProgress);
  }

  function goToNextPage(): void {
    syncCurrentPage(isDoublePage ? currentPage + 2 : currentPage + 1);
  }

  function goToPreviousPage(): void {
    syncCurrentPage(isDoublePage ? currentPage - 2 : currentPage - 1);
  }

  function registerPageContainer(node: HTMLDivElement | null): void {
    if (!node) {
      return;
    }

    setPageContainers((current) => {
      if (current.includes(node)) {
        return current;
      }

      return [...current, node];
    });
  }

  function handleScroll(): void {
    const scrollTop = viewportRef.current?.scrollTop ?? 0;
    const estimatedPage = Math.max(1, Math.round(scrollTop / 64) || currentPage);
    useReaderStore.getState().hydrateBookState({
      bookId: book.id,
      page: estimatedPage,
      scrollTop,
      totalPages,
    });
    useReaderStore.getState().setPageState(estimatedPage, scrollTop, totalPages);
    useLibraryStore.getState().updateProgress({
      bookId: book.id,
      currentPage: estimatedPage,
      scrollTop,
      totalPages,
      progress: formatProgress(estimatedPage, totalPages),
      updatedAt: new Date().toISOString(),
    });
  }

  const readerShellClassName = useMemo(() => {
    const base = "relative flex h-full w-full overflow-hidden rounded-[2rem] border border-white/10 bg-white/8 text-white shadow-2xl backdrop-blur-3xl";

    return readerState.theme === "night"
      ? `${base} bg-slate-950/85`
      : `${base} bg-slate-100/70 text-slate-900`;
  }, [readerState.theme]);

  return (
    <section
      className={readerShellClassName}
      data-fullscreen={readerState.isFullscreenZen ? "true" : "false"}
      onMouseEnter={() => setHoverHud(true)}
      onMouseLeave={() => setHoverHud(false)}
    >
      <aside
        className={`absolute left-0 top-0 z-20 h-full w-80 border-r border-white/10 bg-black/20 p-4 backdrop-blur-2xl transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">Notas</p>
            <h2 className="text-lg font-semibold">Panel lateral</h2>
          </div>
          <button
            type="button"
            className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs text-white transition hover:bg-white/20"
            onClick={() => setSidebarOpen(false)}
          >
            Cerrar
          </button>
        </div>
        <div className="mt-4 space-y-3 text-sm text-white/70">
          <p>Espacio reservado para highlights, notas, clips y herramientas futuras.</p>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
            <p className="text-xs uppercase tracking-[0.2em] text-white/40">Libro activo</p>
            <p className="mt-1 font-medium text-white">{book.title}</p>
            <p className="text-white/60">Página {currentPage} de {totalPages || "?"}</p>
          </div>
        </div>
      </aside>

      <div className="relative flex min-h-0 flex-1 flex-col">
        <header
          className={`absolute left-4 right-4 top-4 z-30 flex items-center justify-between rounded-3xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-2xl transition-opacity duration-300 ${hoverHud ? "opacity-100" : "opacity-40"}`}
        >
          <div className="min-w-0">
            <p className="truncate text-xs uppercase tracking-[0.3em] text-white/50">AetherReader</p>
            <h1 className="truncate text-base font-semibold">{book.title}</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="rounded-full border border-white/10 bg-white/10 px-3 py-2 text-xs transition hover:bg-white/20"
              onClick={() => useReaderStore.getState().setReaderMode(isDoublePage ? "single" : "double")}
            >
              {isDoublePage ? "1 pág" : "2 pág"}
            </button>
            <button
              type="button"
              className="rounded-full border border-white/10 bg-white/10 px-3 py-2 text-xs transition hover:bg-white/20"
              onClick={() => useReaderStore.getState().toggleTheme()}
            >
              {readerState.theme === "day" ? "Modo noche" : "Modo día"}
            </button>
            <button
              type="button"
              className="rounded-full border border-white/10 bg-white/10 px-3 py-2 text-xs transition hover:bg-white/20"
              onClick={() => useReaderStore.getState().toggleSidebar()}
            >
              Panel
            </button>
            <button
              type="button"
              className="rounded-full border border-white/10 bg-white/10 px-3 py-2 text-xs transition hover:bg-white/20"
              onClick={() => useReaderStore.getState().setFullscreenZen(!readerState.isFullscreenZen)}
            >
              Zen
            </button>
          </div>
        </header>

        <div
          ref={viewportRef}
          className="relative flex-1 overflow-auto px-6 pb-6 pt-24"
          onScroll={handleScroll}
        >
          <div className="mx-auto flex min-h-full max-w-7xl flex-col items-center justify-center gap-8">
            {loading ? (
              <div className="rounded-3xl border border-white/10 bg-white/10 px-6 py-4 text-sm text-white/70 backdrop-blur-xl">
                Cargando PDF...
              </div>
            ) : null}

            {error ? (
              <div className="rounded-3xl border border-rose-400/20 bg-rose-500/10 px-6 py-4 text-sm text-rose-100">
                {error}
              </div>
            ) : null}

            <div
              ref={containerRef}
              className={`flex w-full items-stretch justify-center gap-6 ${isDoublePage ? "flex-row" : "flex-col"}`}
            >
              {pageRange.map((pageNumber, index) => (
                <div
                  key={`${book.id}-${pageNumber}`}
                  ref={registerPageContainer}
                  className="min-h-[60vh] w-full max-w-[min(90vw,900px)] rounded-[2rem] border border-white/10 bg-black/20 p-4 shadow-2xl backdrop-blur-xl"
                >
                  <div className="mb-3 flex items-center justify-between text-xs text-white/50">
                    <span>Página {pageNumber}</span>
                    <span>{index === 0 ? "Lectura principal" : "Página contigua"}</span>
                  </div>
                  <div className="reader-page overflow-hidden rounded-[1.5rem] bg-black/10" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <button
          type="button"
          aria-label="Página anterior"
          className={`absolute left-4 top-1/2 z-40 -translate-y-1/2 rounded-full border border-white/15 bg-white/10 p-4 text-white shadow-xl backdrop-blur-xl transition hover:scale-105 hover:bg-white/20 ${hoverHud ? "opacity-100" : "opacity-50"}`}
          onClick={goToPreviousPage}
        >
          ‹
        </button>
        <button
          type="button"
          aria-label="Página siguiente"
          className={`absolute right-4 top-1/2 z-40 -translate-y-1/2 rounded-full border border-white/15 bg-white/10 p-4 text-white shadow-xl backdrop-blur-xl transition hover:scale-105 hover:bg-white/20 ${hoverHud ? "opacity-100" : "opacity-50"}`}
          onClick={goToNextPage}
        >
          ›
        </button>

        <footer
          className={`absolute bottom-4 left-1/2 z-30 -translate-x-1/2 rounded-full border border-white/10 bg-white/10 px-5 py-2 text-xs font-medium backdrop-blur-2xl transition-opacity duration-300 ${hoverHud ? "opacity-100" : "opacity-40"}`}
        >
          Página {currentPage} · {progress.toFixed(1)}% · Zoom {(zoom * 100).toFixed(0)}%
        </footer>

        <div className={`absolute bottom-6 right-6 z-30 flex flex-col gap-3 transition-opacity duration-300 ${hoverHud ? "opacity-100" : "opacity-50"}`}>
          <button
            type="button"
            className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs text-white backdrop-blur-xl transition hover:bg-white/20"
            onClick={() => useReaderStore.getState().setZoom(clamp(zoom + 0.1, 0.5, 3))}
          >
            Zoom +
          </button>
          <button
            type="button"
            className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs text-white backdrop-blur-xl transition hover:bg-white/20"
            onClick={() => useReaderStore.getState().setZoom(clamp(zoom - 0.1, 0.5, 3))}
          >
            Zoom -
          </button>
          <button
            type="button"
            className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs text-white backdrop-blur-xl transition hover:bg-white/20"
            onClick={() => useReaderStore.getState().setBrightness(clamp(brightness + 0.1, 0.5, 2))}
          >
            Brillo +
          </button>
          <button
            type="button"
            className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs text-white backdrop-blur-xl transition hover:bg-white/20"
            onClick={() => useReaderStore.getState().setBrightness(clamp(brightness - 0.1, 0.5, 2))}
          >
            Brillo -
          </button>
        </div>

        {readerState.isFullscreenZen ? (
          <div className="pointer-events-none absolute inset-0 z-50 bg-black/5" aria-hidden="true" />
        ) : null}

        <div className="sr-only" aria-live="polite">
          {book.title}, página {currentPage} de {totalPages || "desconocido"}
        </div>
      </div>
    </section>
  );
}