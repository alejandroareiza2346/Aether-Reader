**Archivo creado: `architecture.md`**

Aquí tienes el contenido completo y profesional de **architecture.md** para **AetherReader**:

```markdown
# AetherReader - Arquitectura Técnica

## 1. Visión General
**AetherReader** es una aplicación de escritorio premium para gestión y lectura inmersiva de libros digitales (PDF-first), construida con enfoque en rendimiento, experiencia de usuario fluida y sincronización robusta.

**Objetivos de la arquitectura:**
- Rendimiento nativo-like (bajo consumo de RAM/CPU).
- Offline-first con sincronización bidireccional.
- Código mantenible y extensible.
- Experiencia glassmorphic moderna y minimalista.
- Seguridad y privacidad por diseño.

## 2. Stack Tecnológico (Recomendado 2026)

### Core Desktop
- **Tauri 2.x** (Rust backend + Web frontend)
- **Frontend**: React 19 + TypeScript + Vite
- **UI Library**: shadcn/ui + Tailwind CSS + Radix UI + Framer Motion
- **Estilo**: Glassmorphism + Dark/Light mode automático + temas personalizados

### Lectura de PDFs
- **PDF.js** (principal) optimizado con workers
- Posible fallback a Rust bindings (mupdf o poppler) para PDFs muy grandes

### Almacenamiento
- **Local**:
  - SQLite (via `tauri-plugin-sql` o `sqlx` en Rust)
  - Tauri FS para archivos de libros
  - IndexedDB como caché secundario (TanStack Query)
- **Cloud**:
  - **Supabase** (Auth + Postgres + Storage + Realtime) o
  - **PocketBase** (self-hosted, Go single binary)

### Estado y Datos
- **Zustand** (global state ligero)
- **TanStack Query** (server state, caching, sync)
- **Zod** para validación de esquemas

### Otras dependencias clave
- `pdf-lib` / `pdfjs-dist` para metadata y manipulación
- `sharp` o Rust image processing para portadas
- `date-fns` / `dayjs`
- `i18next` para multilingual



## 4. Entidades de Datos (Schema)

### Tabla `books`
```sql
id UUID PRIMARY KEY DEFAULT uuid_generate_v4()
user_id UUID REFERENCES auth.users

title TEXT NOT NULL
authors TEXT[] 
isbn TEXT
publisher TEXT
file_hash TEXT UNIQUE          -- Para deduplicación
file_path TEXT                 -- Ruta local (encriptada opcional)
total_pages INTEGER
current_page INTEGER DEFAULT 1
current_position FLOAT DEFAULT 0.0   -- % vertical en la página
progress REAL DEFAULT 0.0
status TEXT CHECK (status IN ('pending', 'reading', 'paused', 'finished'))

date_added TIMESTAMPTZ DEFAULT NOW()
date_started TIMESTAMPTZ
date_last_read TIMESTAMPTZ DEFAULT NOW()
date_finished TIMESTAMPTZ

cover_path TEXT
tags TEXT[]
rating INTEGER CHECK (rating >= 0 AND rating <= 5)
notes TEXT

metadata JSONB                 -- Datos extraídos del PDF
created_at TIMESTAMPTZ DEFAULT NOW()
updated_at TIMESTAMPTZ DEFAULT NOW()
```

### Otras tablas importantes
- `annotations` / `highlights` (con page, position, color, text, note)
- `reading_sessions` (tiempo leído por sesión)
- `collections` + `books_collections` (muchos a muchos)
- `user_settings` (temas, preferencias de lectura, filtros oculares)

## 5. Flujo de Datos y Sincronización

1. **Offline-first**: SQLite es la fuente de verdad local.
2. **Sync Engine** (background worker en Rust):
   - Detecta cambios locales (via triggers o polling ligero).
   - Sube metadatos + progreso a Supabase.
   - Archivos grandes (PDFs): opción "sync metadata only" + copia manual o Storage upload opcional.
   - Conflict resolution: Last Write Wins + timestamps + merge inteligente en anotaciones.
3. **Realtime**: Supabase subscriptions para cambios en otros dispositivos.

## 6. Arquitectura del Lector

- Canvas de PDF.js + overlays transparentes (React) para highlights y notas.
- Controles: 
  - HUD fade-in/out (hover o tecla).
  - Flechas laterales discretas.
  - Panel lateral colapsable (herramientas).
- Modos: Single page, Double page, Continuous scroll.
- Filtros oculares: CSS filters + canvas post-processing (sepia, brightness, contrast, tint).

## 7. Seguridad y Privacidad
- Encriptación local opcional de biblioteca (Rust `age` o `chacha20`).
- Supabase RLS (Row Level Security).
- Hashes de archivos para integridad.
- Sin telemetría por defecto.

## 8. Empaquetado y Distribución
- Tauri produce:
  - Windows: .exe + MSI
  - Linux: .AppImage + .deb
  - macOS: .dmg (fácil de agregar)
- Auto-updates vía Tauri Updater.

## 9. Extensibilidad Futura
- Plugin system (Rust + JS).
- Soporte EPUB/MOBI vía crates.
- Integración IA local (Ollama).
- API para exportaciones avanzadas.

## 10. Decisiones No Funcionales
- Rendimiento objetivo: < 80MB RAM en idle, < 250MB leyendo PDF grande.
- Startup < 2 segundos.
- Totalmente keyboard navigable.
- Accesible (WCAG AA).

---


aetherreader

aetherreader/
├── README.md
├── architecture.md
├── package.json                 # (pendiente de generar)
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.ts
├── .env.example
├── .gitignore
│
├── public/                      # Assets estáticos (íconos, fonts)
│   └── icons/
│
├── docs/                        # Documentación
│   ├── architecture.md
│   ├── api.md
│   ├── database-schema.md
│   └── roadmap.md
│
├── schema/                      # Esquemas SQL y Supabase
│   ├── migrations/
│   └── supabase/
│
├── src/                         # Código frontend (React + TS)
│   ├── app/                     # Páginas y rutas principales
│   │   ├── library/
│   │   ├── reader/
│   │   └── auth/
│   ├── components/              # Componentes UI reutilizables
│   │   ├── ui/                  # shadcn/ui components
│   │   ├── reader/              # Canvas PDF, HUD, etc.
│   │   └── library/
│   ├── features/                # Feature slices (Redux/Zustand style)
│   │   ├── library/
│   │   ├── reader/
│   │   ├── annotations/
│   │   └── sync/
│   ├── lib/                     # Utilidades compartidas
│   │   ├── utils.ts
│   │   ├── pdf.ts
│   │   └── api.ts
│   ├── stores/                  # Zustand stores
│   ├── types/                   # TypeScript interfaces
│   ├── hooks/                   # Custom hooks
│   └── assets/                  # Imágenes, svgs locales
│
├── src-tauri/                   # Backend Rust (Tauri)
│   ├── src/
│   │   ├── main.rs
│   │   ├── commands/            # Comandos expuestos a frontend
│   │   │   ├── file.rs
│   │   │   ├── metadata.rs
│   │   │   └── sync.rs
│   │   ├── db/                  # SQLite + migrations
│   │   ├── services/            # Lógica de negocio
│   │   │   ├── sync_service.rs
│   │   │   ├── pdf_service.rs
│   │   │   └── library_service.rs
│   │   └── models/              # Structs Rust
│   ├── migrations/              # Migraciones SQL
│   ├── tauri.conf.json
│   ├── Cargo.toml
│   └── build.rs
│
└── .github/                     # (futuro) Workflows CI/CD