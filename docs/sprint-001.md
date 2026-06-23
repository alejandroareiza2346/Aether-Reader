# Sprint 001 — Biblioteca + App Runnable

**Estado:** En progreso (Dev Lead: Cursor)  
**Objetivo:** App web funcional con biblioteca, import PDF y lector conectados.

## Tickets

| ID | Título | Owner | Estado |
|----|--------|-------|--------|
| AR-001 | Scaffolding Vite + Tailwind | Dev Lead (Cursor) | ✅ Done |
| AR-002 | Pantalla Biblioteca (grid/lista) | Dev Lead (Cursor) | ✅ Done |
| AR-003 | Import PDF drag & drop | Dev Lead (Cursor) | ✅ Done |
| AR-004 | Navegación Library ↔ Reader | Dev Lead (Cursor) | ✅ Done |
| AR-005 | Test plan regresión lector | QA Engineer | 🔲 Pendiente |
| AR-006 | Actualizar README usuario | Technical Writer | 🔲 Pendiente |
| AR-007 | Integración Tauri 2 | Lead Backend (otra IA) | 🔲 Pendiente |
| AR-008 | SQLite local | Lead Backend (otra IA) | 🔲 Pendiente |

## Cómo probar (Dev)

```bash
npm install
npm run dev
```

1. Abrir `http://localhost:5173`
2. Importar uno o más PDFs (drag & drop o clic)
3. Ver libros en grid o lista
4. Buscar y filtrar por estado
5. Clic en **Leer/Continuar** → abre lector
6. Navegar páginas, verificar auto-save
7. **← Biblioteca** vuelve con progreso guardado

## Handoff QA (AR-005)

Validar:

- [ ] Import 1 PDF
- [ ] Import múltiples PDFs
- [ ] Rechazo de archivo no-PDF
- [ ] Búsqueda por título
- [ ] Filtro por estado
- [ ] Toggle grid/lista
- [ ] Abrir lector y volver
- [ ] Progreso persiste tras recargar página
- [ ] Eliminar libro
- [ ] Atajos lector: ← → F Z Escape

Reportar bugs con: pasos, esperado, actual, severidad (P0-P3).

## Handoff Technical Writer (AR-006)

Actualizar `README.md`:

- Sección "Uso rápido" con pasos de importar y leer
- Capturas o GIF (opcional)
- Aclarar que v0.1 es web; Tauri viene en AR-007

No documentar features no implementadas como si existieran.

## Handoff Lead Backend (AR-007 / AR-008)

Leer `architecture.md` secciones 3, 5 y 8.

Próximo trabajo:

1. Inicializar `src-tauri/` con Tauri 2
2. Comando `library.import_pdf(path)` 
3. SQLite tabla `books` según schema en architecture.md
4. Reemplazar blob URLs por rutas locales persistentes

Contrato IPC pendiente — Dev Lead definirá en AR-009.
