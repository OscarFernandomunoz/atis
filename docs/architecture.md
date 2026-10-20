# Estructura del proyecto

La aplicación es un proyecto de Electron organizado por proceso y por dominio. Todas las
carpetas y los nombres de archivo están en inglés; los comentarios, la documentación y los
textos de la interfaz se mantienen en español.

```text
src/
├── main/
│   ├── index.ts                         # Inicialización de Electron
│   ├── ipc/                             # Canales IPC separados por dominio
│   │   ├── index.ts                     # Registro de todos los grupos
│   │   ├── automation.ts                # SofiaPlus: ejecución y pausa
│   │   ├── spreadsheet.ts               # Escritura de horas en Excel
│   │   ├── notifications.ts             # Permiso y avisos del sistema
│   │   └── window.ts                    # Barra de título y controles nativos
│   ├── services/
│   │   ├── sofia-plus/                  # Automatización del portal
│   │   │   ├── index.ts                 # Orquestación del flujo
│   │   │   ├── login.ts                 # Helper del formulario de login
│   │   │   ├── navigation/              # Un archivo por opción del menú
│   │   │   │   ├── index.ts             # API pública de navegación
│   │   │   │   ├── open-aspirante-options.ts
│   │   │   │   ├── select-curriculum-option.ts
│   │   │   │   ├── find-environment-management-option.ts
│   │   │   │   ├── find-ambientes-option.ts
│   │   │   │   ├── find-instructor-activity-time-option.ts
│   │   │   │   ├── find-program-lookup-button.ts
│   │   │   │   └── find-reports-option.ts
│   │   │   ├── types.ts                 # Tipos de la automatización
│   │   │   ├── browser/                 # Capa de navegador
│   │   │   │   ├── index.ts             # API pública de la capa
│   │   │   │   ├── timing.ts            # Espera entre acciones
│   │   │   │   ├── block-ui-patch.ts    # Parcheo de jQuery blockUI
│   │   │   │   ├── wait-save-patch.ts   # Parcheo de esperaGuardar
│   │   │   │   ├── opener-shim-patch.ts # Shim de window.opener
│   │   │   │   ├── input-guard-patch.ts # Bloqueo de entrada del usuario
│   │   │   │   ├── input-guard.ts       # Estado del bloqueo de entrada
│   │   │   │   ├── page-guards.ts       # Aplicación de parches a los frames
│   │   │   │   ├── frames.ts            # Recorrido de frames
│   │   │   │   ├── window-tracker.ts    # Ventanas emergentes
│   │   │   │   ├── click.ts             # Clic por coordenadas
│   │   │   │   ├── click-marker/        # Marcador visual del clic
│   │   │   │   │   ├── index.ts         # API pública
│   │   │   │   │   ├── script.ts        # Script inyectado en la página
│   │   │   │   │   └── styles.ts        # Estilos del retículo y la etiqueta
│   │   │   ├── workflow/                # Piezas del flujo
│   │   │   │   ├── step-banner.ts       # Contador de progreso
│   │   │   │   ├── pause-gate.ts        # Pausa y reanudación
│   │   │   │   ├── session-reset.ts     # Limpieza de la sesión
│   │   │   │   ├── window-loader.ts     # Carga de la ventana del portal
│   │   │   │   ├── window-lock.ts       # Bloqueo de la ventana
│   │   │   │   └── window-size.ts       # Tamaño de la ventana
│   │   │   └── report/                  # Helpers del reporte
│   │   │       ├── index.ts             # API pública de los helpers
│   │   │       ├── dates.ts             # Campos de fecha
│   │   │       ├── identification-type.ts
│   │   │       ├── identification-field.ts
│   │   │       ├── search-button/
│   │   │       │   ├── index.ts
│   │   │       │   └── click-search-input.ts
│   │   │       ├── result-link.ts
│   │   │       ├── learning-results-option.ts
│   │   │       ├── form-submit-button.ts
│   │   │       └── total-hours.ts
│   │   ├── spreadsheet/                 # Escritura de horas con Excel COM
│   │   │   ├── index.ts                 # API pública
│   │   │   ├── apply-hours-multiple.ts
│   │   │   └── excel-com-multiple-script.ts
│   │   ├── notifications/               # Avisos del sistema
│   │   │   ├── index.ts                 # API pública
│   │   │   ├── service.ts               # Electron + respaldo WSL
│   │   │   └── windows-toast.ts         # Toast nativo de Windows
│   │   ├── platform/                    # Utilidades del sistema operativo
│   │   │   ├── index.ts                 # API pública
│   │   │   ├── powershell.ts
│   │   │   ├── windows-app-id.ts
│   │   │   └── wsl.ts
│   │   └── settings.ts                  # Preferencias persistidas
│   └── windows/
│       ├── index.ts                     # API pública de ventanas
│       ├── appearance.ts                # Ciclo de la barra de título
│       ├── palette.ts                   # Colores por tema
│       ├── remote-chrome.ts             # Cromo de páginas remotas
│       └── manager.ts                   # Ventana principal
├── preload/
│   └── index.ts                         # Puente seguro renderer -> main
├── renderer/
│   ├── index.html                       # Shell mínimo con directivas @include
│   ├── partials/                        # Secciones HTML de la interfaz
│   │   ├── title-bar.html
│   │   ├── content-header.html
│   │   ├── scheduling.html
│   │   ├── access-form.html
│   │   ├── dropzone.html
│   │   ├── instructors.html
│   │   ├── placeholders.html
│   │   ├── player-bar.html
│   │   ├── preview-modal.html
│   │   └── notifications-modal.html
│   ├── index.ts                         # Arranque del renderer
│   ├── app/
│   │   └── types.ts                     # Tipos del DOM y del estado
│   ├── features/                        # Módulos por dominio
│   │   ├── automation/
│   │   │   ├── submit.ts                # Orquestación del envío
│   │   │   ├── consulting.ts            # Instructor en consulta
│   │   │   └── player-bar/              # Barra de progreso
│   │   ├── instructors/                 # Carnets, filtros y selección
│   │   ├── notifications/               # Consentimiento y avisos
│   │   ├── scheduling/                  # Carrusel de meses y fechas
│   │   ├── spreadsheet/
│   │   │   ├── index.ts                 # API pública del dominio
│   │   │   ├── preview/                 # Lectura y tabla del archivo
│   │   │   └── update/                  # Escritura de horas en el libro
│   │   └── theme/
│   │       ├── index.ts                 # API pública del tema
│   │       └── background.ts            # Fondo ambiental dinámico
│   ├── shell/                           # Piezas del armazón de la app
│   │   ├── preview-modal.ts
│   │   └── title-bar.ts
│   └── styles/
│       ├── index.css                    # Entrada de estilos
│       ├── foundation/                  # Tokens, base, animaciones y responsive
│       ├── shell/                       # Layout, barra de título y modal
│       │   └── modal/                   # Botón, diálogo y animaciones
│       ├── components/                  # Formularios, iconos y avisos
│       │   ├── icons/                   # Base, reveal y animaciones
│       │   └── notifications/           # Consentimiento y avisos flotantes
│       └── features/                    # Estilos de cada dominio
│           ├── dropzone/
│           ├── automation/
│           │   └── player-bar/          # Animaciones, layout, controles y progreso
│           ├── spreadsheet/             # Vista previa, filtros, tabla y acciones
│           ├── instructors/             # Carnets, tarjeta, filtros y responsive
│           └── scheduling/              # Carrusel, tarjetas y paleta
└── shared/
    ├── index.ts                         # API pública de lo compartido
    ├── window.ts                        # Tipos y constantes de ventana
    └── notifications.ts                 # Tipos de avisos del sistema
```

## Límites entre procesos

- `main` es responsable de ventanas, automatización y APIs privilegiadas de Electron.
- `preload` expone una API pequeña y explícita mediante `contextBridge`.
- `renderer` contiene la interfaz y nunca accede directamente a Node.
- `shared` contiene código que debe coincidir entre `main`, `preload` y `renderer`.

## Reglas de organización

- Cada carpeta de dominio expone su API con un `index.ts` que solo reexporta.
- `main/ipc/` agrupa los canales por dominio; `ipc/index.ts` solo los registra.
- `renderer/features/` contiene la lógica de producto y `renderer/shell/` el armazón visual.
- Los estilos siguen la misma división que el renderer: base, armazón, componentes y dominios.
  Cuando un dominio crece, se convierte en carpeta con un `index.css` que solo importa sus partes.
- `renderer/index.html` es un shell pequeño. Las secciones viven en `renderer/partials/` y
  `scripts/static-assets.ts` expande las directivas `@include` al generar `dist/renderer/index.html`.
- Los archivos se mantienen por debajo de ~200 líneas. La vista previa de Excel se dividió en
  lectura (`preview/column.ts`), tabla (`preview/table.ts`), filtros (`preview/view.ts`) y
  controlador (`preview/controller.ts`).

## Flujo del tema

- `renderer/features/theme/background.ts` genera el degradado ambiental y lo publica en la
  variable CSS `--app-gradient`.
- `renderer/shell/title-bar.ts` sincroniza la barra nativa con el tema oscuro de la app.
- `main/windows/appearance.ts` aplica el tema a la barra nativa y al cromo de las páginas
  remotas; `palette.ts` guarda los colores por tema.

## Automatización de SofiaPlus

- `sofia-plus/index.ts` solo orquesta: delega el banner, la carga de la ventana y cada paso.
- `sofia-plus/browser/` encapsula todo lo que habla con Electron: parches de página, recorrido
  de frames, ventanas emergentes y clics. `window-tracker.ts` es el único dueño del estado de
  ventanas emergentes; `frames.ts` lo consulta mediante `getTrackedChildWindows`.
- `sofia-plus/workflow/` contiene las piezas del flujo (banner de progreso, puerta de pausa,
  limpieza de sesión y carga de la ventana).
- `workflow/window-loader.ts` crea la ventana visible del portal en una partición propia
  (`SOFIA_PARTITION`). Al reutilizarla vuelve a cargar la URL base, de modo que cada corrida
  arranca en el login.
- `workflow/session-reset.ts` cierra la ventana del portal y borra cookies, almacenamiento local,
  caché y credenciales de esa partición. Se ejecuta al empezar cada corrida y al terminarla
  (con éxito o error), para que no quede una sesión abierta y el siguiente intento no reutilice
  una sesión a medias. Al usar una partición aislada, el tema y las demás preferencias de la app
  (sesión por defecto) quedan intactos.
- `sofia-plus/report/` divide el reporte por paso: fechas, apertura del diálogo, tipo y campo
  de identificación, botón de búsqueda y enlace de resultado.
- Los módulos son carpetas con un `index.ts` barril. Quien consume importa de `browser/index.js`,
  `report/index.js` o `workflow/...` según corresponda, nunca de un archivo interno de otra capa.

## Helpers inyectados en la página

`sofia-plus/index.ts` inyecta los helpers de `login.ts`, `navigation/` y `report/` con
`.toString()` y los ejecuta dentro de la página de SofiaPlus. Cada uno debe ser autocontenido:
sin imports en tiempo de ejecución, sin constantes de módulo y sin llamadas a otros módulos.

`npm run check:serialized` compila esos módulos con la configuración real de esbuild y evalúa
cada función en un contexto sin módulos, para detectar dependencias que romperían la
inyección en producción. `npm run build` lo ejecuta automáticamente.

## Salida de compilación

El script de compilación genera los tres puntos de entrada de Electron en:

```text
dist/
├── main/index.js
├── preload/index.js
└── renderer/index.js
```
