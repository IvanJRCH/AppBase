# App — proyecto base (sin login)

Resumen para agentes: cómo correr, construir y extender este proyecto base.

## Stack
- Backend: `main.js` — Express puro (CommonJS), sin `express-session`, sin login, sin SQLite. Sirve la GUI estática desde `gui/build`, monta `api.js` en `/api` y monta los routers de `modules/modules.js` también en `/api`.
- GUI: `gui/` — SvelteKit 5 (runas `$state`/`$derived`/`$props`), Tailwind CSS v4, Flowbite-svelte, router tipo `hash`, adaptador `@sveltejs/adapter-static`. `gui/src/routes/layout.css` contiene `@import "tailwindcss"` y se importa en `+layout.svelte`: sin ese archivo NO se generan estilos (CSS vacío).
- Build: `bun build --compile` genera un ejecutable único que incrusta `main.js` + `gui/build`.
- Icono Windows: `agregar-icono.js` (pe-library + resedit) inyecta `app.ico` en `app.exe`.
- El nombre mostrado en la GUI se toma de `config.json` (`gui.appName` = "App"); no usar el nombre anterior en código ni documentación.
- Los metadatos que se graban dentro del `.exe` (titulo, publicador, descripcion, version, copyright) se toman de `binary.json` en la raíz; NO poner esos valores fijos en `compilar.sh` ni en `agregar-icono.js`. `config.json` es solo para la GUI/backend.

## Layout
- `main.js` — backend. Puerto/host desde `config.json`. Monta `api.js` y los routers de los módulos en `/api`. Tras escuchar, llama a `abrirNavegador(urlLocal)` si `server.abrirNavegador !== false`.
- `api.js` — API de ejemplo base (`/api/ping`, `/api/datos`). Router de Express, sin lógica de módulos.
- `abrir-navegador.js` — abre la URL local en el navegador del sistema (`start`/`open`/`xdg-open` con fallback a `gio`); si falla, solo avisa por consola. Se controla con `server.abrirNavegador` en `config.json` (default `true`).
- `detectar-addons.js` — escanea `node_modules/**/*.node`, detecta la plataforma por cabecera, copia cada binario a `vendor-addons/<plataforma>/` y genera `addons-nativos.js` (metadata) y `addons-assets.sh` (flags `--asset`). Con `--windows` descarga/cachea el prebuild de sqlite3 para Windows (patrón tomado de `~/Vídeos/inventario`). Lo ejecuta `postinstall` y `compilar.sh`.
- `addons-native.js` — se importa primero en `main.js`; lee los assets incrustados desde la raíz virtual de Bun (`/$bunfs/root` Linux, `B:/~BUN/root` Windows — con `--bytecode` `import.meta.dir` apunta al directorio del build, no sirve), los escribe en un temp dir (`build/Release/<addon>.node` + raíz) y parchea `bindings.getRoot`. NO mover ese require después de los módulos.
- `compilar.sh` compila Linux con los addons locales y Windows con `bun detectar-addons.js --windows --only-win32`; al final restaura los archivos generados a la plataforma local.
- `modules/base-datos/` — ejemplo con Sequelize + SQLite. `sqlite3` debe requerirse estáticamente y pasarse como `dialectModule` (Sequelize usa un require dinámico que Bun no empaqueta).
- `modules/modules.js` — imports **estáticos** de los `index.js` de los módulos backend y exporta `modules`. No hay descubrimiento en runtime.
- `gui/src/lib/modulos.svelte.js` — imports **estáticos** de los componentes `.svelte`; exporta `modulos`, funciones de visibilidad (`ocultarModulo`, `mostrarModulo`, `alternarModulo`, `setModuloVisible`, `esModuloVisible`, `mostrarTodos`, `ocultarTodos`) y las listas filtradas (`modulosVisibles()`, `grupos()`, `modulosDelGrupo()`). Alimenta el menú. El sufijo `.svelte.js` es obligatorio para usar runes.
- `modules/<nombre>/index.js` — lógica backend del módulo (router de Express; opcional). `modules/<nombre>/gui/X.svelte` — su interfaz (opcional). Un módulo puede tener solo una de las dos partes.
- `gui/src/routes/Home/+page.svelte` — shell responsivo con header fijo, sidebar y render del componente del módulo activo (`moduloActivo.Componente`).
- `gui/src/lib/api.js` — `peticion()` (fetch). `gui/src/lib/config.js` — `apiUrl()`, `appName`, `appVersion` desde `config.json`.
- Los componentes en `modules/` están fuera de `gui/`: `gui/vite.config.js` tiene un plugin `resolverModulos` para resolver paquetes desde `gui/node_modules`, y `gui/src/routes/layout.css` incluye `@source "../../../modules"` para Tailwind.

## Comandos
- Dev backend: `bun dev` (puerto 7070 por defecto). Usar `bun`, no `node`.
- IMPORTANTE: solo puede haber **una** instancia escuchando en el puerto 7070. Si queda un proceso huérfano (`./app` o `bun main.js`), el siguiente arranque falla con `EADDRINUSE`. `main.js` ya tiene un manejador `servidor.on('error')` que imprime el error y sale con código 1 (Bun silencia este error si no hay manejador, y pareciera que "se cierra al instante" sin aviso). Para liberar: `fuser -k 7070/tcp`.
- Dev GUI: `cd gui && npm run dev` (proxy `/api` al backend).
- Build GUI: `cd gui && npm run build` → `gui/build`.
- Compilar todo: `./compilar.sh` → `app` (Linux) y `app.exe` (Windows con ícono).
- Dependencias: `bun install` (raíz) y `cd gui && npm install`.

## Reglas
- SIN login: no agregar `express-session`, ni `/login`, ni `/logout`, ni `isAuthenticated`. Las pantallas son de acceso libre.
- Módulo con GUI = crear `modules/<nombre>/gui/X.svelte` + entrada en `gui/src/lib/modulos.svelte.js` (con `name`, `label`, `grupo`, `icono`, `Componente`). NO crear archivos en `gui/src/routes/` ni bloques `{#if}` en `Home/+page.svelte`.
- Para ocultar/mostrar entradas del menú en runtime, usar las funciones de visibilidad de `gui/src/lib/modulos.svelte.js`; NO quitar entradas del arreglo ni agregar condicionales en `Home/+page.svelte`. **Por defecto todos los módulos están ocultos**: hay que llamar a `mostrarModulo` (o `mostrarTodos`) para que aparezcan. El estado es en memoria y `Home` ya se recalcula solo (si se oculta el módulo activo, vuelve al inicio).
- Módulo con lógica backend = crear `modules/<nombre>/index.js` que exporte un router de Express por defecto + importarlo y agregarlo al arreglo en `modules/modules.js`. Un módulo sin `index.js` es solo GUI; uno sin entrada en `gui/src/lib/modulos.svelte.js` es solo backend (no aparece en el menú). Usar siempre imports estáticos: Bun no incrusta rutas calculadas en runtime dentro del binario.
- Las rutas de los módulos se montan en `/api` (ej.: `router.get('/ejemplo/saludo')` → `/api/ejemplo/saludo`). La API base sigue en `api.js`.
- Addons nativos: NO hardcodear rutas `.node`. `detectar-addons.js` los descubre y genera los archivos; `compilar.sh` ya pasa los flags `--asset` y se encarga del prebuild de Windows. Si se agrega una dependencia con `.node`, ejecutar `bun run detect:addons` y recompilar; para Windows, `bun detectar-addons.js --windows` (sqlite3 se descarga solo; otros paquetes necesitan traer su `.node` win32).
- Layout en `Home/+page.svelte`: header y sidebar SIEMPRE visibles (no envolverlos en `{#if menuActivo}`). El header mide `h-16` (4rem) y el sidebar va de `top-16` a `bottom-0`. Bajo `lg`: sidebar off-canvas (`-translate-x-full` / `translate-x-0`), con overlay, cierre con `Esc` y scroll bloqueado; desde `lg`: `lg:translate-x-0` y contenido con `lg:pl-64`. El contenido usa `mx-auto max-w-7xl` + `px-4 sm:px-6 lg:px-8`: NO usar `w-full` junto con `lg:ml-64` (daría scroll horizontal).
- Mantener el diseño responsivo en pantallas nuevas: grids de 1 columna en móvil y 2-3 en `sm`/`xl`, tablas con `overflow-x-auto` (o tarjetas en móvil) y botones que no desborden (`w-full sm:w-auto`).
- Tras cambios en backend o GUI, recompilar con `./compilar.sh` para verlo en el ejecutable.
- El ejecutable Linux (ELF) no lleva ícono de ventana (limitación del formato); el .exe de Windows sí.
