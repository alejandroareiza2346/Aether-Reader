# AetherReader — Coordinación del Equipo IA

**Dev Lead / Implementación:** Cursor (este chat)  
**Tú:** Product Owner — apruebas prioridades y pasas handoffs entre IAs.

## Flujo

```
PO (tú) → Dev Lead (Cursor) implementa → QA valida → Technical Writer documenta → Lead Backend (Tauri/SQLite)
```

## Reglas

1. **Un ticket por chat** en las otras IAs.
2. Siempre adjuntar: `@src/AETHERREADER_CONTEXT.md`, `@architecture.md`, `@docs/sprint-001.md`.
3. Solo Cursor modifica código salvo que el PO indique lo contrario.
4. QA no implementa fixes; reporta bugs en formato estándar.
5. Technical Writer actualiza docs **después** de QA OK.

## Prompts para copiar

### QA Engineer
```text
Eres QA de AetherReader. Lee docs/sprint-001.md sección Handoff QA.
Ejecuta el test plan AR-005. Genera checklist con PASS/FAIL y bugs reproducibles.
No modifiques código.
```

### Technical Writer
```text
Eres Technical Writer de AetherReader. Ticket AR-006.
Lee README.md y docs/sprint-001.md. Actualiza solo lo implementado en Sprint 001.
Entrega diff sugerido para README.md.
```

### Lead Backend (Tauri)
```text
Eres Lead Backend de AetherReader. Tickets AR-007 y AR-008.
Lee architecture.md (SQLite, IPC, Tauri). No toques UI React.
Propón estructura src-tauri/ y contrato IPC para import_pdf y list_books.
```

## Estado actual

Ver `src/AETHERREADER_CONTEXT.md` — actualizado por Dev Lead al cerrar cada sprint.
