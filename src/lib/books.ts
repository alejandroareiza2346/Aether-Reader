import * as pdfjsLib from "pdfjs-dist";

import { ensurePdfWorker } from "./pdf";
import type { BookDraft } from "../types/book";

function titleFromFileName(fileName: string): string {
  return fileName.replace(/\.pdf$/i, "").replace(/[-_]/g, " ").trim();
}

export async function buildBookDraftFromFile(file: File): Promise<BookDraft> {
  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    throw new Error("Solo se admiten archivos PDF.");
  }

  ensurePdfWorker();

  const fileUrl = URL.createObjectURL(file);
  let totalPages: number | undefined;

  try {
    const loadingTask = pdfjsLib.getDocument({ url: fileUrl });
    const documentProxy = await loadingTask.promise;
    totalPages = documentProxy.numPages;
    await documentProxy.destroy();
  } catch {
    totalPages = undefined;
  }

  return {
    title: titleFromFileName(file.name),
    fileName: file.name,
    fileUrl,
    totalPages,
  };
}

export async function buildBookDraftsFromFiles(files: FileList | File[]): Promise<BookDraft[]> {
  const pdfFiles = Array.from(files).filter(
    (file) => file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf"),
  );

  if (pdfFiles.length === 0) {
    throw new Error("No se encontraron archivos PDF válidos.");
  }

  return Promise.all(pdfFiles.map((file) => buildBookDraftFromFile(file)));
}

export function formatRelativeDate(isoDate?: string): string {
  if (!isoDate) {
    return "Sin lectura";
  }

  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return "Hoy";
  }

  if (diffDays === 1) {
    return "Ayer";
  }

  if (diffDays < 7) {
    return `Hace ${diffDays} días`;
  }

  return date.toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
}

export const STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  reading: "Leyendo",
  paused: "Pausado",
  finished: "Terminado",
};
