# AetherReader

**La aplicación de escritorio premium para leer PDFs con progreso inteligente y sincronización en la nube.**

![Version](https://img.shields.io/badge/Version-0.1.0-blue)
![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20Linux-success)
![License](https://img.shields.io/badge/License-MIT-green)

## ¿De qué trata?

**AetherReader** es una aplicación de escritorio moderna y enfocada en la experiencia de lectura inmersiva. Permite **importar, organizar, leer y seguir el progreso** de libros digitales (principalmente **PDF**), con la capacidad de retomar **exactamente donde lo dejaste** en cualquier dispositivo.

No es solo otro lector de PDFs: es una **biblioteca personal inteligente** con seguimiento automático, herramientas de retención de conocimiento y diseño premium glassmorphic.

## Problemas que resuelve

- Pierdes el punto exacto de lectura cuando tienes múltiples libros en paralelo.
- Cambias constantemente entre explorador, Adobe Reader, apps móviles y carpetas desorganizadas.
- No tienes control visual de tu progreso, tiempo leído ni estadísticas.
- Quieres resaltar, anotar y sincronizar todo sin depender de servicios cerrados o pesados.
- Buscas una experiencia limpia, rápida y bonita en escritorio (Windows + Linux).

## Visión del Producto

Crear la mejor experiencia de lectura digital en escritorio: **fluida, privada, offline-first y sincronizable**.

### Funcionalidades Principales (MVP + Próximas)

#### ✅ Core (Ya implementado / En progreso)

- Biblioteca personal con grid y vista lista
- Importar PDFs (drag & drop, múltiples archivos)
- Lector integrado potente con **PDF.js**:
  - Vista de 1 o 2 páginas
  - Navegación horizontal + scroll continuo
  - Flechas discretas laterales (HUD fade in/out)
  - Zoom, rotación, ajuste de brillo y filtros oculares (sepia, alto contraste, temperatura de color)
  - Modo Zen / fullscreen
  - Atajos de teclado (`← →`, `F` tema, `Z` zen, etc.)
- **Auto-guardado de progreso** cada 3 segundos (página + posición vertical)
- Estados del libro: Pendiente, Leyendo, Pausado, Terminado
- Persistencia local (localStorage + futuro SQLite)

#### 🚀 MVP (Próximas semanas)

- Pantalla completa de Biblioteca (búsqueda, filtros, tags, ordenamiento)
- Extracción automática de metadatos y portadas
- CRUD completo de libros
- Panel lateral para notas y resaltados
- Modo oscuro/claro automático + temas personalizados
- Exportar / importar biblioteca

#### ✨ Futuro (Fase Premium)

- **Sincronización en la nube** (Supabase o PocketBase)
- Inicio de sesión y múltiples dispositivos
- Resaltados, notas, marcadores con colores y búsqueda full-text
- Estadísticas avanzadas (tiempo leído, velocidad, heatmaps, streaks)
- Soporte EPUB, MOBI y otros formatos
- IA local (resúmenes, preguntas, mindmaps con Ollama)
- Colecciones, series y wishlist
- Modo presentación y control de brillo avanzado
- Self-host sync option
- Plugins y temas de comunidad

## Requisitos del Sistema

**Para usuarios finales:**

- Windows 10/11 o Linux (distribuciones modernas)
- Procesador 64-bit
- 4 GB RAM (recomendado 8 GB)
- ~200 MB de espacio (app ligera gracias a Tauri)

**Para desarrollo:**

- Node.js 20+
- Rust (instalado vía rustup)
- Tauri CLI
- Git

## Stack Tecnológico

### Objetivo Final (Arquitectura Recomendada)

- **Desktop**: Tauri 2 (Rust backend) + React 19
- **Frontend**: TypeScript + Vite + Tailwind + shadcn/ui + Framer Motion
- **PDF Rendering**: PDF.js (optimizado con Web Workers)
- **Estado**: Zustand + TanStack Query
- **Almacenamiento local**: SQLite (via Tauri)
- **Cloud**: Supabase (Auth + Postgres + Storage + Realtime) o PocketBase
- **Estilo**: Glassmorphism / Aero premium, totalmente responsive

### Estado Actual

- Proyecto Vite + React + TypeScript
- PDFReader funcional con todas las características de lectura
- Stores con Zustand + persistencia local
- Estructura escalable preparada para Tauri

## Instalación y Ejecución (Actual)

```bash
git clone https://github.com/alejandroareiza2346/Aether-Reader.git
cd Aether-Reader

# Instalar dependencias
npm install

# Ejecutar en modo desarrollo (web)
npm run dev
```

**Próximamente**: Comandos para `tauri dev` y builds nativos.

## Estructura del Proyecto

```
Aether-Reader/
├── src/                  # Código React + TS
│   ├── app/              # Páginas
│   ├── components/       # UI reutilizable
│   ├── features/         # Lógica por dominio
│   ├── stores/           # Zustand stores
│   ├── lib/              # Utilidades PDF y API
│   └── types/            # Interfaces TypeScript
├── src-tauri/            # Backend Rust (próximo)
├── schema/               # Migraciones SQL
├── public/               # Assets
└── docs/                 # Documentación
```

## Experiencia del Usuario

1. El usuario agrega un libro a su biblioteca.
2. Abre el libro desde la app.
3. Lee directamente ahí mismo.
4. La app guarda la página actual y el punto de lectura.
5. Al volver, continúa exactamente donde se quedó.

## Modelo de Datos (por libro)

- Título, autor y portada
- Formato del archivo
- Total de páginas y posición de lectura
- Página actual y porcentaje de avance
- Estado (pendiente, leyendo, pausado, terminado)
- Fechas de inicio, última lectura y finalización
- Notas y comentarios

## Decisiones de Diseño

- App de escritorio para **Windows** y **Linux**, empaquetada como ejecutable o instalador.
- Formato principal: **PDF** (arquitectura extensible a otros formatos).
- Navegación horizontal con controles discretos y menú flotante desde el borde.
- Estética glassmorphic / aero, limpia y premium.
- Modos de vista: una página y dos páginas.
- Filtros oculares y control de brillo sobre el PDF.
- Modo día y modo noche.
- Progreso sincronizable entre dispositivos (fase cloud).
- Stack: **Tauri 2 + React + TypeScript + PDF.js + Supabase** (plan inicial gratuito y viable para desarrollo en solitario).

## Roadmap

1. **Semana 1-2**: Completar UI de Biblioteca + integración Tauri
2. **Semana 3-4**: SQLite local + persistencia robusta
3. **Mes 2**: Supabase sync + auth
4. **Mes 3**: Notas, resaltados y estadísticas
5. **Mes 4+**: IA local, EPUB, release 1.0

## Contribución

Este es un proyecto personal en fase activa de desarrollo. ¡Cualquier sugerencia o PR es bienvenido!

## Licencia

MIT © 2026 AetherReader
