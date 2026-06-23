# AetherReader — Arquitectura Técnica
> Versión: 2026.1 | Stack: Tauri 2 + React 19 + TypeScript + SQLite

---

## 1. Visión General

**AetherReader** es una aplicación de escritorio premium para la gestión y lectura inmersiva de libros digitales (PDF-first), construida con un enfoque radical en rendimiento nativo, experiencia glassmorphic y sincronización robusta *offline-first*.

### Principios Fundacionales

| Principio | Descripción |
|-----------|-------------|
| **Offline-First** | SQLite es la única fuente de verdad. La nube es un espejo, no una dependencia. |
| **Rendimiento Nativo** | < 80 MB RAM en idle, < 250 MB leyendo PDFs grandes. Sin excepciones. |
| **Privacidad por Diseño** | Cero telemetría. Cifrado local opcional. Red solo al endpoint del usuario. |
| **UX Premium** | 60 FPS constantes. Animaciones glassmorphic. Keyboard-navigable completo. |
| **Código Mantenible** | TypeScript estricto + Rust tipado + separación clara de capas. |

---

## 2. Stack Tecnológico (2026)

### Backend — Capa Nativa (Rust)

| Tecnología | Rol | Justificación |
|------------|-----|---------------|
| **Tauri 2.x** | Shell de escritorio, IPC, Webview | Runtime mínimo (~600 KB), seguridad por capabilities |
| **Tokio** | Runtime asíncrono | Concurrencia sin bloqueo para sync engine y DB |
| **sqlx** | Driver SQLite async | Queries tipadas en tiempo de compilación, pool r2d2 |
| **serde / serde_json** | Serialización IPC | Conversión eficiente Rust ↔ TypeScript |
| **ChaCha20-Poly1305** | Cifrado en reposo | Mejor ratio rendimiento/seguridad que AES en ARM |

### Frontend — Capa UI (React)

| Tecnología | Rol | Justificación |
|------------|-----|---------------|
| **React 19 + TypeScript** | UI declarativa | Concurrent Mode, Server Components futuros |
| **Vite 6** | Build tool | HMR instantáneo, tree-shaking agresivo |
| **Zustand 5** | Estado global síncrono | < 2 KB, sin boilerplate, middleware persist |
| **TanStack Query v5** | Estado asíncrono / caché | Stale-while-revalidate para sync backend |
| **shadcn/ui + Tailwind** | Sistema de diseño | Componentes accesibles, sin CSS-in-JS overhead |
| **Framer Motion** | Micro-interacciones | GPU-accelerated, respeta `prefers-reduced-motion` |
| **Zod** | Validación de esquemas | Validación runtime + inferencia de tipos TypeScript |

### Renderizado de Documentos

| Tecnología | Rol | Notas |
|------------|-----|-------|
| **PDF.js (pdfjs-dist)** | Renderizado principal | Ejecutado en Web Worker dedicado |
| **Tauri Custom Protocol** | Streaming de assets | `asset://` — sin cargar el PDF completo en memoria |
| **Canvas API** | Output de página | Con disposal agresivo al salir del viewport |

### Almacenamiento y Sincronización

| Tecnología | Rol | Modo |
|------------|-----|------|
| **SQLite (WAL mode)** | DB local, fuente de verdad | Siempre activo |
| **Supabase** | Auth + DB remota + Realtime | Opcional / cuando hay red |
| **Tauri FS Plugin** | Acceso a filesystem nativo | Scoped al directorio de biblioteca |

---

## 3. Arquitectura del Sistema e Integración IPC

El canal IPC entre el frontend y el backend Rust es el **cuello de botella principal a evitar**. La arquitectura lo divide en tres capas:

```
┌─────────────────────────────────────────────────────────┐
│              FRONTEND (React / Zustand)                 │
│                                                         │
│  UI Layer ──► State Layer ──► IPC Adapter Layer         │
└────────────────────────┬────────────────────────────────┘
                         │
          ┌──────────────┼──────────────────┐
          │              │                  │
   (1) Comandos    (2) Eventos         (3) asset://
   IPC Ligeros     Tauri (Push)        Custom Protocol
   (JSON < 1KB)    (Notificaciones)    (Streaming binario)
          │              │                  │
┌─────────▼──────────────▼──────────────────▼────────────┐
│              BACKEND (Tauri / Rust / Tokio)             │
│                                                         │
│  Commands ──► Services ──► SQLite DB                    │
│                    └──────► Sync Engine (background)    │
└─────────────────────────────────────────────────────────┘
```

### Reglas de Comunicación IPC

1. **Comandos IPC** → Solo para payloads de metadatos ligeros (JSON). Guardar progreso, configuración, crear/actualizar registros.
2. **Custom Protocol `asset://`** → Todo binario (PDFs, imágenes de portadas). El Webview solicita porciones del archivo por streaming HTTP. **Nunca** se carga un PDF completo en `Vec<u8>`.
3. **Eventos Tauri (Push)** → El backend notifica proactivamente al frontend (sync completado, nuevo libro detectado, error de lectura).
4. **Debounce de escritura** → El frontend agrupa actualizaciones de progreso cada **3 segundos** (Zustand middleware) antes de despachar a Tauri, reduciendo ciclos de CPU y protegiendo la batería.

---

## 4. Entidades de Datos

### 4.1 Esquema SQLite Local

```sql
-- ============================================
-- PRAGMA: Configuración de rendimiento
-- ============================================
PRAGMA journal_mode = WAL;       -- Lecturas concurrentes sin bloqueo
PRAGMA synchronous = NORMAL;     -- Balance rendimiento / durabilidad
PRAGMA foreign_keys = ON;
PRAGMA cache_size = -32000;      -- 32 MB de caché en memoria

-- ============================================
-- TABLE: books
-- ============================================
CREATE TABLE IF NOT EXISTS books (
    id            TEXT PRIMARY KEY NOT NULL,         -- UUID v4 generado en Rust
    user_id       TEXT,                              -- NULL si no hay auth activo

    -- Identidad del libro
    title         TEXT NOT NULL,
    authors       TEXT,                              -- JSON array: '["Autor 1", "Autor 2"]'
    isbn          TEXT,
    publisher     TEXT,
    language      TEXT DEFAULT 'es',

    -- Archivo
    file_hash     TEXT UNIQUE NOT NULL,              -- SHA-256 para deduplicación
    file_path     TEXT NOT NULL,                     -- Ruta absoluta local
    file_size     INTEGER,                           -- Bytes
    total_pages   INTEGER NOT NULL DEFAULT 1,

    -- Progreso de lectura
    current_page      INTEGER NOT NULL DEFAULT 1,
    current_position  REAL    NOT NULL DEFAULT 0.0, -- % scroll vertical en la página
    progress          REAL    NOT NULL DEFAULT 0.0, -- 0.0 - 1.0

    -- Estado
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'reading', 'paused', 'finished')),

    -- Fechas ISO 8601 (almacenadas como TEXT en SQLite)
    date_added      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    date_started    TEXT,
    date_last_read  TEXT,
    date_finished   TEXT,

    -- Enriquecimiento
    cover_path  TEXT,                               -- Ruta a miniatura extraída/generada
    tags        TEXT DEFAULT '[]',                  -- JSON array
    rating      INTEGER DEFAULT NULL CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5)),
    notes       TEXT DEFAULT '',

    -- Metadatos extensibles (extraídos del PDF o importados)
    metadata    TEXT DEFAULT '{}',                  -- JSON: { description, subject, ... }

    -- Sync
    is_dirty    INTEGER NOT NULL DEFAULT 1,         -- 1 = pendiente de sync
    synced_at   TEXT,

    -- Auditoría
    created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- ============================================
-- TABLE: annotations
-- ============================================
CREATE TABLE IF NOT EXISTS annotations (
    id          TEXT PRIMARY KEY NOT NULL,
    book_id     TEXT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    user_id     TEXT,

    page        INTEGER NOT NULL,
    type        TEXT NOT NULL CHECK (type IN ('highlight', 'note', 'bookmark', 'underline')),
    color       TEXT NOT NULL DEFAULT '#FFD700',    -- HEX color
    text        TEXT,                               -- Texto seleccionado
    note        TEXT,                               -- Nota del usuario
    position    TEXT NOT NULL DEFAULT '{}',         -- JSON: { x, y, width, height, rects[] }

    is_dirty    INTEGER NOT NULL DEFAULT 1,
    created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- ============================================
-- TABLE: reading_sessions
-- (Historial separado para no mutar books frecuentemente)
-- ============================================
CREATE TABLE IF NOT EXISTS reading_sessions (
    id          TEXT PRIMARY KEY NOT NULL,
    book_id     TEXT NOT NULL REFERENCES books(id) ON DELETE CASCADE,

    start_time  TEXT NOT NULL,
    end_time    TEXT,
    pages_read  INTEGER NOT NULL DEFAULT 0,
    duration_s  INTEGER,                            -- Calculado al cerrar la sesión

    created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- ============================================
-- TABLE: collections
-- ============================================
CREATE TABLE IF NOT EXISTS collections (
    id          TEXT PRIMARY KEY NOT NULL,
    name        TEXT NOT NULL,
    description TEXT,
    color       TEXT DEFAULT '#6366F1',
    icon        TEXT DEFAULT 'folder',
    sort_order  INTEGER DEFAULT 0,

    created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS books_collections (
    book_id       TEXT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    collection_id TEXT NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
    added_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    PRIMARY KEY (book_id, collection_id)
);

-- ============================================
-- TABLE: user_settings (key-value tipado)
-- ============================================
CREATE TABLE IF NOT EXISTS user_settings (
    key         TEXT PRIMARY KEY NOT NULL,
    value       TEXT NOT NULL,                      -- JSON serializado
    updated_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- ============================================
-- ÍNDICES de rendimiento
-- ============================================
CREATE INDEX IF NOT EXISTS idx_books_status       ON books(status);
CREATE INDEX IF NOT EXISTS idx_books_last_read    ON books(date_last_read DESC);
CREATE INDEX IF NOT EXISTS idx_books_dirty        ON books(is_dirty) WHERE is_dirty = 1;
CREATE INDEX IF NOT EXISTS idx_annotations_book   ON annotations(book_id, page);
CREATE INDEX IF NOT EXISTS idx_sessions_book      ON reading_sessions(book_id, start_time DESC);

-- ============================================
-- TRIGGER: auto-update updated_at
-- ============================================
CREATE TRIGGER IF NOT EXISTS books_updated_at
    AFTER UPDATE ON books
    FOR EACH ROW BEGIN
        UPDATE books SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
        WHERE id = OLD.id;
    END;
```

### 4.2 Tipos TypeScript Correspondientes

```typescript
// src/types/database.ts

export type BookStatus = 'pending' | 'reading' | 'paused' | 'finished';
export type AnnotationType = 'highlight' | 'note' | 'bookmark' | 'underline';

export interface Book {
  id: string;
  userId: string | null;
  title: string;
  authors: string[];
  isbn: string | null;
  publisher: string | null;
  language: string;
  fileHash: string;
  filePath: string;
  fileSize: number | null;
  totalPages: number;
  currentPage: number;
  currentPosition: number;   // 0.0 - 1.0
  progress: number;           // 0.0 - 1.0
  status: BookStatus;
  dateAdded: string;
  dateStarted: string | null;
  dateLastRead: string | null;
  dateFinished: string | null;
  coverPath: string | null;
  tags: string[];
  rating: 1 | 2 | 3 | 4 | 5 | null;
  notes: string;
  metadata: Record<string, unknown>;
  isDirty: boolean;
  syncedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Annotation {
  id: string;
  bookId: string;
  userId: string | null;
  page: number;
  type: AnnotationType;
  color: string;
  text: string | null;
  note: string | null;
  position: AnnotationPosition;
  isDirty: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AnnotationPosition {
  x: number;
  y: number;
  width: number;
  height: number;
  rects: Array<{ x: number; y: number; width: number; height: number }>;
}

export interface ReadingSession {
  id: string;
  bookId: string;
  startTime: string;
  endTime: string | null;
  pagesRead: number;
  durationS: number | null;
  createdAt: string;
}

export interface Collection {
  id: string;
  name: string;
  description: string | null;
  color: string;
  icon: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserSetting<T = unknown> {
  key: string;
  value: T;
  updatedAt: string;
}
```

---

## 5. Flujo de Datos y Sincronización

### Flujo Principal (Lectura)

```
Usuario abre libro
        │
        ▼
Zustand: setCurrentBook(id)
        │
        ▼
Tauri IPC: get_book_metadata(id) ──► SQLite: SELECT * FROM books WHERE id = ?
        │
        ▼
Custom Protocol: asset://library/{file_hash}.pdf ──► Rust streaming ──► PDF.js Worker
        │
        ▼
Canvas render (página actual ± 1 en memoria)
        │
        ▼
Usuario navega / hace scroll
        │
        ├──► Zustand: updateProgress() [inmediato en UI]
        │         │
        │         └──► debounce 3s ──► Tauri IPC: save_progress() ──► SQLite UPDATE
        │
        └──► Página sale del viewport ──► page.cleanup() + canvas.width = 0
```

### Sync Engine (Background Rust / Tokio)

```
Tokio background task (cada 30s o en foreground)
        │
        ▼
SQLite: SELECT * FROM books WHERE is_dirty = 1
        │
        ├── Sin red ──► Cola local persistida. Reintentar en próximo ciclo.
        │
        └── Con red ──► Supabase UPSERT (metadata + progreso, NO archivo binario)
                  │
                  └──► UPDATE books SET is_dirty = 0, synced_at = NOW()
```

### Resolución de Conflictos

- **Estrategia**: Last Write Wins basado en `updated_at` ISO 8601.
- **Excepción para progreso**: Se conserva el `current_page` más alto (nunca retroceder progreso involuntariamente).
- **Anotaciones**: Merge por `id` — inserciones no conflictivas por UUID.

---

## 6. Arquitectura del Lector PDF (Optimización)

### Virtualización de Canvas (Windowing)

Solo se mantienen en el DOM las páginas visibles + 1 de buffer:

```
Viewport visible: [página N]
En memoria:       [página N-1] [página N] [página N+1]
Destruidas:       todo lo demás → page.cleanup() + canvas reset
```

### Pipeline de Renderizado

```
PDF.js Worker Thread
        │
        ▼
page.render({ canvasContext, viewport }) ──► Canvas (offscreen)
        │
        ▼
CSS Filters (GPU): brightness() contrast() sepia() hue-rotate()
[Aplicados al contenedor, NO al canvas — evita re-render]
        │
        ▼
Modo Noche Inteligente:
  ├── Texto/vectores: mix-blend-mode: difference (invierte sin destruir imágenes)
  └── Imágenes embebidas: detección por tipo de contenido → exclusión del filtro
```

### Disposal de Recursos (Obligatorio)

```typescript
// Al salir del viewport virtualizado:
const destroyPage = (canvas: HTMLCanvasElement, pdfPage: PDFPageProxy) => {
  pdfPage.cleanup();         // Libera recursos internos de PDF.js
  canvas.width = 0;          // Fuerza al motor Chromium/WebKit a liberar texturas GPU
  canvas.height = 0;
  // El GC de JS recoge el resto en el siguiente ciclo
};
```

---

## 7. Estructura de Carpetas

```
aetherreader/
│
├── architecture.md              ← Este archivo
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.ts
├── components.json              ← shadcn/ui config
├── .env.example
│
├── public/
│   └── icons/
│
├── docs/
│   ├── architecture.md
│   ├── api.md
│   ├── database-schema.md
│   └── roadmap.md
│
├── src/
│   ├── main.tsx                 ← Entry point React
│   ├── App.tsx                  ← Router principal
│   │
│   ├── app/                     ← Páginas / vistas
│   │   ├── library/
│   │   │   ├── LibraryPage.tsx
│   │   │   └── components/
│   │   ├── reader/
│   │   │   ├── ReaderPage.tsx
│   │   │   └── components/
│   │   ├── settings/
│   │   │   └── SettingsPage.tsx
│   │   └── onboarding/
│   │       └── OnboardingPage.tsx
│   │
│   ├── components/
│   │   ├── ui/                  ← shadcn/ui (generados)
│   │   ├── reader/              ← PDFCanvas, HUD, Controls, Overlays
│   │   ├── library/             ← BookCard, BookGrid, Filters, SearchBar
│   │   ├── common/              ← Layout, Sidebar, Topbar, Modal, Toast
│   │   └── glassmorphic/        ← GlassPanel, GlassButton, GlassCard
│   │
│   ├── features/                ← Lógica de features (hooks + queries + mutations)
│   │   ├── library/
│   │   │   ├── useLibrary.ts
│   │   │   ├── useImportBook.ts
│   │   │   └── queries.ts
│   │   ├── reader/
│   │   │   ├── useReader.ts
│   │   │   ├── useProgress.ts
│   │   │   └── useAnnotations.ts
│   │   ├── annotations/
│   │   └── sync/
│   │       └── useSyncEngine.ts
│   │
│   ├── stores/                  ← Zustand stores
│   │   ├── useLibraryStore.ts
│   │   ├── useReaderStore.ts
│   │   ├── useSettingsStore.ts
│   │   └── useUIStore.ts
│   │
│   ├── hooks/                   ← Custom hooks globales
│   │   ├── useKeyboard.ts
│   │   ├── useTheme.ts
│   │   └── useDebounce.ts
│   │
│   ├── lib/
│   │   ├── utils.ts             ← cn(), formatters, helpers
│   │   ├── pdf.ts               ← PDF.js initialization + worker config
│   │   ├── ipc.ts               ← Tauri invoke wrappers tipados
│   │   ├── db.ts                ← Query helpers locales
│   │   └── sync.ts              ← Supabase client + sync utils
│   │
│   └── types/
│       ├── database.ts          ← Book, Annotation, Session, Collection
│       ├── ipc.ts               ← Payloads Tauri IPC
│       ├── reader.ts            ← ReaderState, FilterOptions, ViewMode
│       └── global.d.ts
│
└── src-tauri/
    ├── Cargo.toml
    ├── tauri.conf.json
    ├── build.rs
    │
    ├── migrations/              ← Archivos SQL de migración
    │   └── 0001_initial.sql
    │
    └── src/
        ├── main.rs
        ├── lib.rs
        │
        ├── commands/            ← Funciones expuestas via IPC
        │   ├── mod.rs
        │   ├── books.rs         ← CRUD books
        │   ├── reader.rs        ← save_progress, get_book
        │   ├── library.rs       ← scan_folder, import_pdf
        │   ├── annotations.rs
        │   └── settings.rs
        │
        ├── db/
        │   ├── mod.rs
        │   ├── connection.rs    ← Pool SQLite, PRAGMA init
        │   └── migrations.rs    ← Runner de migraciones
        │
        ├── services/
        │   ├── mod.rs
        │   ├── library_service.rs
        │   ├── pdf_service.rs   ← Extracción metadata, hash, cover
        │   └── sync_service.rs  ← Tokio background sync
        │
        └── models/              ← Structs Rust (espejo de DB)
            ├── mod.rs
            ├── book.rs
            ├── annotation.rs
            └── session.rs
```

---

## 8. Seguridad

| Área | Implementación |
|------|---------------|
| **Cifrado en reposo** | ChaCha20-Poly1305 vía `chacha20poly1305` crate (opt-in por usuario) |
| **Aislamiento Webview** | Capabilities Tauri 2: FS scoped solo a `$APP_DATA/library/` |
| **Sin scripts externos** | CSP estricto. No se carga ningún recurso externo en el Webview |
| **RLS en Supabase** | Row Level Security: `user_id = auth.uid()` en todas las tablas |
| **Integridad de archivos** | SHA-256 hash al importar. Verificación al abrir |
| **Telemetría** | Cero. Sin analytics, sin Sentry, sin beacons externos |

---

## 9. Empaquetado y Distribución

| Plataforma | Output | Notas |
|------------|--------|-------|
| **Windows** | `.exe` (NSIS) + `.msi` | Certificado de código recomendado |
| **macOS** | `.dmg` + `.app` (Universal Binary) | Firma obligatoria para distribución |
| **Linux** | `.AppImage` + `.deb` + `.rpm` | AppImage portable por defecto |

- **Auto-updates**: Tauri Updater v2 con canal `stable` / `beta`.
- **Tamaño objetivo del bundle**: < 15 MB (sin Webview embebido en Windows/macOS).

---

## 10. Objetivos de Rendimiento

| Métrica | Objetivo | Estrategia |
|---------|----------|-----------|
| **RAM — Idle** | < 80 MB | Rust mínimo, sin background workers JS innecesarios |
| **RAM — Leyendo** | < 250 MB | Virtualización Canvas, disposal agresivo, streaming |
| **Startup time** | < 2 s | Lazy init de DB y sync engine; splash screen nativo |
| **Time to first page** | < 1 s | Custom Protocol streaming + primera página prioritaria |
| **FPS — Scroll** | 60 FPS constantes | CSS transforms (GPU), no layout thrashing |
| **Tamaño bundle** | < 15 MB | Tree-shaking, dynamic imports, sin frameworks pesados |
| **Accesibilidad** | WCAG AA | Roles ARIA, focus management, contraste > 4.5:1 |

---

## 11. Extensibilidad Futura

```
v0.1  ── MVP: Lector PDF + Biblioteca básica + SQLite local
v0.2  ── Anotaciones + Sync Supabase + Colecciones
v0.3  ── Stats de lectura + Goals + Streaks
v0.4  ── EPUB soporte vía crate `epub`
v0.5  ── IA local: Resumen + Q&A via Ollama (llama3)
v1.0  ── Plugin system (Rust + JS) + API pública
```

---

*Última actualización: 2026 — AetherReader Core Team*