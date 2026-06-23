import type { DragEvent } from "react";

interface ImportDropZoneProps {
  isImporting: boolean;
  onImportFiles: (files: FileList | File[]) => void;
}

export function ImportDropZone({ isImporting, onImportFiles }: ImportDropZoneProps) {
  function handleDrop(event: DragEvent<HTMLLabelElement>): void {
    event.preventDefault();
    if (event.dataTransfer.files.length > 0) {
      onImportFiles(event.dataTransfer.files);
    }
  }

  return (
    <label
      className="flex cursor-pointer flex-col items-center justify-center rounded-[2rem] border border-dashed border-white/15 bg-white/5 px-6 py-10 text-center backdrop-blur-xl transition hover:border-sky-400/40 hover:bg-white/8"
      onDragOver={(event) => event.preventDefault()}
      onDrop={handleDrop}
    >
      <input
        type="file"
        accept="application/pdf,.pdf"
        multiple
        className="hidden"
        disabled={isImporting}
        onChange={(event) => {
          if (event.target.files && event.target.files.length > 0) {
            onImportFiles(event.target.files);
            event.target.value = "";
          }
        }}
      />
      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-2xl">
        +
      </div>
      <p className="text-base font-medium text-white">
        {isImporting ? "Importando PDFs..." : "Arrastra PDFs aquí o haz clic para importar"}
      </p>
      <p className="mt-2 max-w-md text-sm text-white/50">
        Puedes importar varios archivos a la vez. El progreso se guardará automáticamente al leer.
      </p>
    </label>
  );
}
