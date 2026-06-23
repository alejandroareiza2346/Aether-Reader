# AETHERREADER - CONTEXTO GLOBAL (Mantén siempre este contexto)

**Nombre del Proyecto**: AetherReader
**Versión actual**: 0.1.0 (Sprint 001)
**Descripción**: Aplicación de escritorio premium para leer PDFs, gestionar biblioteca personal y seguimiento inteligente de progreso. Enfoque en experiencia inmersiva, glassmorphic, offline-first y sincronización futura.

**Stack Objetivo**:
- Tauri 2 (Rust) + React 19 + TypeScript + Vite
- PDF.js (renderizado)
- Tailwind + Glassmorphism
- Zustand + TanStack Query (futuro)
- SQLite local (offline-first)
- Supabase (Auth + DB + Sync) o PocketBase

**Estado Actual (Sprint 001)**:
- ✅ App Vite runnable (`npm run dev`)
- ✅ Biblioteca: grid/lista, búsqueda, filtros por estado
- ✅ Import PDF: drag & drop, múltiples archivos, extracción de páginas
- ✅ Navegación Library ↔ Reader
- ✅ Lector PDF (1/2 páginas, zoom, brillo, filtros, auto-save 3s, HUD, zen)
- ✅ Stores Zustand + localStorage
- 🔲 Tauri, SQLite, sync cloud, notas/resaltados

**Rutas / Pantallas**:
- `LibraryPage` — pantalla principal (default)
- `ReaderPage` — lector PDF

**Reglas Inviolables**:
- Código limpio, tipado fuerte (TypeScript).
- Prioriza UX premium, rendimiento y accesibilidad.
- Siempre offline-first.
- Usa patrones modernos 2026.

**Sprint activo**: `docs/sprint-001.md`
