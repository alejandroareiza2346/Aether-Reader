import { GlobalWorkerOptions } from "pdfjs-dist";

let workerConfigured = false;

export function ensurePdfWorker(): void {
  if (workerConfigured) {
    return;
  }

  GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url,
  ).toString();

  workerConfigured = true;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function formatProgress(page: number, totalPages: number): number {
  if (totalPages <= 0) {
    return 0;
  }

  return clamp((page / totalPages) * 100, 0, 100);
}