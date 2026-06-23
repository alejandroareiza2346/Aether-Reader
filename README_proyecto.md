# Aplicación de lectura y progreso de libros

## Idea resumida
Una aplicación de escritorio donde el usuario pueda guardar libros, abrirlos dentro del mismo lugar para leerlos e interactuar con ellos. El flujo principal será con libros PDF, pero la arquitectura debe permitir soportar otros archivos de texto en el futuro. También debe registrar automáticamente el progreso de lectura: página actual, avance total, fecha de última lectura y estado del libro.

## Objetivo del producto
Centralizar la lectura y el seguimiento de libros en un solo sitio, para que el usuario no solo almacene títulos, sino que también pueda retomar la lectura exactamente donde la dejó.

## Problema que resuelve
- Evita perder el punto exacto de lectura.
- Permite guardar libros y su información asociada.
- Lleva control del avance por libro.
- Hace más cómodo retomar lecturas largas o múltiples libros al mismo tiempo.

## Alcance inicial recomendado
### Funciones principales
- Crear una biblioteca personal.
- Agregar libros cargando archivos, con soporte principal para PDF.
- Leer el libro dentro de la app.
- Navegar de forma horizontal entre páginas.
- Guardar la página actual.
- Registrar el progreso total por libro.
- Marcar estado: pendiente, leyendo, terminado.
- Buscar y filtrar libros.
- Mostrar controles de navegación con flechas discretas que no obstruyan el contenido.
- Usar un menú desplegable o activado desde el borde para mantener la interfaz limpia.

### Funciones opcionales para después
- Notas y resaltados.
- Marcadores o favoritos.
- Sincronización en la nube.
- Estadísticas de lectura.
- Modo oscuro.
- Recordatorios de lectura.
- Filtro para los ojos y control de brillo del PDF.
- Vista de una página y vista de dos páginas.

## Datos que debería guardar cada libro
- Título.
- Autor.
- Portada.
- Formato del libro.
- Total de páginas y/o posición de lectura.
- Página actual.
- Porcentaje de avance.
- Estado.
- Fecha de inicio.
- Fecha de última lectura.
- Notas o comentarios.

## Decisiones cerradas
- La app será de escritorio.
- Debe funcionar en Linux y Windows.
- Debe empaquetarse como ejecutable o instalador.
- El formato principal será PDF.
- La navegación dentro del libro será horizontal.
- La interfaz debe incluir resaltadores y herramientas básicas estilo panel flotante.
- El progreso debe sincronizarse entre dispositivos o sesiones.
- La estética debe ser muy limpia, moderna y translúcida, con inspiración en un estilo aero / glass / premium.
- Habrá inicio de sesión y cuentas de usuario.
- Todo lo importante se sincronizará en la nube: libros subidos, progreso, notas, resaltados y configuración.
- La app soportará dos modos de visualización: una sola página y dos páginas en pantalla.
- Debe incluir filtro para los ojos y control de brillo sobre el PDF.
- El menú debe permitir modo día y modo noche.
- La tecnología recomendada para construirla será Electron + React + TypeScript para la app de escritorio, con PDF.js para la lectura de PDFs y Supabase para autenticación, base de datos y sincronización en la nube.
- Se prioriza una solución práctica, gratuita en su plan inicial y viable para un proyecto pequeño con solo una persona desarrollando.

## Experiencia ideal del usuario
1. El usuario agrega un libro a su biblioteca.
2. Abre el libro desde la app.
3. Lee directamente ahí mismo.
4. La app guarda la página actual o el punto de lectura.
5. Cuando vuelve a entrar, continúa desde donde se quedó.

## MVP sugerido
La primera versión debería incluir solo lo esencial:
- Biblioteca de libros.
- Vista de lectura.
- Guardado automático o manual del progreso.
- Reanudación desde la última página.
- Persistencia local de datos.

## Preguntas abiertas que conviene definir
- ¿Qué estructura exacta tendrán las tablas y relaciones en la nube?
- ¿Se necesitará soporte offline con sincronización diferida?
- ¿El brillo del PDF se aplicará como filtro visual o como ajuste interno del renderizado?
- ¿Los dos modos de vista se alternarán manualmente o según el tamaño de pantalla?

## Prompt listo para usar conmigo después
Puedes copiar y pegar esto para pedirme el desarrollo:

```text
Quiero que me ayudes a construir una aplicación de escritorio para guardar y leer libros dentro de la misma plataforma. La app debe funcionar en Linux y Windows, empaquetarse como ejecutable o instalador, y estar enfocada principalmente en archivos PDF, aunque la arquitectura debe poder extenderse a otros archivos de texto.

Necesito que la lectura sea horizontal, con navegación mediante flechas discretas que no tapen el PDF, y con un menú flotante o desplegable desde el borde para mantener una interfaz limpia. También quiero resaltadores y herramientas básicas de lectura en un panel tipo PowerPoint, pero con un diseño moderno, minimalista y translúcido.

La app debe permitir agregar libros, abrirlos para leerlos, registrar la página actual y guardar el progreso de lectura para que el usuario pueda retomar exactamente donde se quedó. La información del libro y del progreso debe quedar persistida y sincronizada en la nube.

Debe incluir inicio de sesión, cuentas de usuario, sincronización completa de libros, progreso, notas, resaltados y configuración. También debe tener vista de una página y de dos páginas, filtro para los ojos, control de brillo del PDF, y menú con modo día y modo noche.

La tecnología recomendada es Electron + React + TypeScript para la app, PDF.js para la lectura y Supabase para autenticación y sincronización. Quiero que tomes esta base y definas la arquitectura, las entidades de datos, la interfaz principal y la forma en que se guardará y sincronizará todo.

Necesito que definas la arquitectura, las entidades de datos, la interfaz principal y la forma en que se guardará y sincronizará el progreso. Si hace falta, propón primero el MVP y luego las mejoras futuras.
```

## Próximo paso recomendado
Antes de programar, conviene decidir estas 3 cosas:
1. Si empezamos con Electron + React + TypeScript + PDF.js + Supabase o si quieres otra variante.
2. Qué alcance exacto tendrá el modo offline.
3. Si quieres que armemos ahora mismo la arquitectura del proyecto.