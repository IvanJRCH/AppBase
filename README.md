# App — Proyecto base de escritorio (sin login)

Base reutilizable para cualquier software de escritorio futuro.

- **Sin login / sin autenticación.**
- **GUI responsiva**: menú lateral fijo en escritorio y cajón deslizante con fondo oscuro en móvil/tablet; contenido fluido que se adapta desde teléfonos hasta pantallas grandes.
- **Módulos:** cada pantalla o servicio vive en su propia carpeta dentro de `modules/`, con lógica backend (`index.js`), interfaz (`gui/*.svelte`) o ambas. La carga es por imports estáticos, sin descubrimiento en runtime.
- **Backend:** Express (Node) que sirve la GUI estática, expone la API base (`api.js`: `/api/ping`, `/api/datos`) y monta la API de cada módulo en `/api`.
- **GUI:** SvelteKit 5 (runes) + Tailwind CSS v4 + Flowbite-svelte, router tipo `hash`, adaptador estático.
- **Empaquetado:** `bun build --compile` genera un ejecutable único que incrusta backend + GUI.
  - Linux: `app` (ELF)
  - Windows: `app.exe` (con ícono y metadatos, cross-compilado desde Linux)

## Estructura

```
app/
├── main.js            # Backend Express (sin sesiones, sin login)
├── api.js             # API de ejemplo base (/api/ping, /api/datos)
├── abrir-navegador.js # Abre el navegador por defecto en la URL local al arrancar
├── detectar-addons.js # Busca .node, detecta plataforma y prepara Windows (prebuild)
├── addons-native.js   # Extrae los .node incrustados y redirige `bindings` al arrancar
├── addons-nativos.js  # GENERADO: metadata de cada .node
├── addons-assets.sh   # GENERADO: flags --asset para compilar.sh
├── vendor-addons/     # GENERADO: binarios .node por plataforma, listos para --asset
├── config.json        # Puerto/host del servidor + nombre/versión de la app (GUI)
├── binary.json        # Metadatos que se graban dentro del .exe (titulo, publicador, etc.)
├── app.ico            # Ícono de Windows (reemplazable)
├── agregar-icono.js   # Inyecta el ícono y los metadatos al .exe de Windows
├── compilar.sh        # Script de compilación (Linux + Windows)
├── package.json       # Dependencias del backend (bun)
├── .gitignore
├── README.md
├── AGENTS.md
├── modules/           # un módulo = una carpeta autónoma
│   ├── modules.js     # imports estáticos de los index.js (backend)
│   ├── pantalla1/gui/Pantalla1.svelte   # solo GUI: consume /api/datos
│   ├── pantalla2/gui/Pantalla2.svelte   # solo GUI: formulario
│   ├── ejemplo/
│   │   ├── index.js                  # lógica + API propia (/api/ejemplo/*)
│   │   └── gui/Ejemplo.svelte        # GUI del módulo
│   ├── servicio/index.js             # solo backend: /api/servicio/estado
│   └── base-datos/
│       ├── index.js                  # Sequelize + SQLite (/api/base-datos/notas)
│       └── gui/BaseDatos.svelte      # interfaz del módulo
└── gui/               # SvelteKit (frontend)
    ├── package.json
    ├── vite.config.js # incluye el plugin resolverModulos
    └── src/
        ├── app.html
        ├── lib/
        │   ├── api.js        # peticion() (fetch con proxy a /api)
        │   ├── config.js     # apiUrl(), appName, appVersion
        │   ├── modulos.svelte.js # imports estáticos de los .svelte + menú + visibilidad
        │   ├── index.js
        │   ├── TemaToggle.svelte
        │   ├── SpinnerCarga.svelte
        │   └── assets/favicon.svg
        └── routes/
            ├── +page.svelte           # redirige a /#/Home
            ├── +layout.svelte         # importa layout.css, favicon y título
            ├── layout.css             # @import "tailwindcss" + flowbite + @source modules
            └── Home/
                └── +page.svelte       # shell responsivo: header + sidebar + módulo activo
```

## Primer uso (desarrollo)

```bash
# 1. Instalar dependencias del backend
bun install

# 2. Instalar dependencias de la GUI
cd gui && npm install && cd ..

# 3. Ejecutar solo el backend (modo desarrollo)
bun dev            # http://127.0.0.1:7070

# 4. (opcional) Ejecutar la GUI en modo dev con recarga en caliente
cd gui && npm run dev   # http://localhost:5173 (proxy a /api)
```

La GUI consume `/api` del mismo servidor (en compilado se sirve estático; en `npm run dev` se hace proxy por `vite.config.js`).

## Diseño responsivo

- **`< 1024px` (móvil/tablet):** el header muestra un botón de menú; el sidebar entra como cajón desde la izquierda, con fondo oscuro, cierre al tocar fuera o con `Esc`, y bloqueo del scroll de fondo.
- **`>= 1024px` (escritorio):** el sidebar queda fijo a la izquierda (`lg:pl-64` en el contenido) y el botón de menú desaparece.
- El contenido usa `mx-auto max-w-7xl` con paddings `px-4 sm:px-6 lg:px-8`, sin `w-full` + `lg:ml-64` (eso causaba scroll horizontal).
- Las pantallas de ejemplo usan grids `grid-cols-1 sm:grid-cols-2 xl:grid-cols-3`, tabla en `md+` y tarjetas en móvil, y botones que apilan en pantallas pequeñas.
- El nombre y la versión mostrados se leen de `config.json` (`gui.appName`, `gui.appVersion`).

## Compilar (genera los ejecutables)

```bash
./compilar.sh
```

Esto:
1. Instala dependencias (`bun install` y `cd gui && npm install`).
2. Compila la GUI (`cd gui && npm run build` → `gui/build`).
3. Genera `app` (Linux, ELF).
4. Genera `app.exe` (Windows, cross-compile, con ícono `app.ico`).

Ejecutar:
- Linux: `./app`
- Windows: `app.exe`

Al iniciar (en el ejecutable y también con `bun dev`), la app abre automáticamente el navegador por defecto en `http://127.0.0.1:7070` (o el host/puerto de `config.json`). Para desactivarlo, pon `"abrirNavegador": false` dentro de `server` en `config.json` y vuelve a compilar. Si el sistema no tiene navegador o no se puede abrir, se imprime la URL para abrirla manualmente.

## Cómo agregar un módulo

Todo se hace con **imports estáticos**: no hay escaneo de carpetas en tiempo de ejecución (Bun no incrusta rutas calculadas en el binario compilado).

### Módulo solo con interfaz

1. Crea `modules/<nombre>/gui/MiModulo.svelte`.
2. Agrega su entrada en `gui/src/lib/modulos.svelte.js`, con un `import` y un objeto en `modulos`:
   ```js
   import MiModulo from '../../../modules/<nombre>/gui/MiModulo.svelte';

   export const modulos = [
     // ...
     {
       name: 'mimodulo',
       label: 'Mi módulo',
       grupo: 'Módulos',
       icono: 'M4 6h16M4 12h16M4 18h16',
       Componente: MiModulo,
     },
   ];
   ```
3. NO hay que tocar `Home/+page.svelte`: el menú y el render del componente son dinámicos.

### Módulo con lógica backend

1. Crea `modules/<nombre>/index.js` exportando un router de Express:
   ```js
   import express from 'express';
   const router = express.Router();

   router.get('/mi-modulo/saludo', (_req, res) => res.json({ ok: true }));

   export default router;
   ```
   La ruta queda en `/api/mi-modulo/saludo`.
2. Agrégalo en `modules/modules.js`:
   ```js
   import miModulo from './<nombre>/index.js';
   export const modules = [/* ... */, miModulo];
   ```

Un módulo puede tener solo backend (sin `gui/`, como `servicio`: no aparece en el menú), solo GUI (como `pantalla1`: usa la API base) o ambas cosas (como `ejemplo`).

Los componentes están fuera de `gui/`; por eso `gui/vite.config.js` incluye el plugin `resolverModulos` (resuelve `flowbite-svelte`, `#lib/*`, etc. desde `gui/node_modules`) y `layout.css` incluye `@source "../../../modules"` para que Tailwind genere sus clases.

Luego vuelve a compilar: `./compilar.sh`.

## Mostrar / ocultar módulos del menú

**Por defecto todos los módulos están ocultos** (el menú arranca vacío). La visibilidad es reactiva y se controla desde cualquier componente importando desde `#lib/modulos.svelte.js`:

```js
import {
  ocultarModulo,
  mostrarModulo,
  alternarModulo,
  setModuloVisible,
  esModuloVisible,
  mostrarTodos,
  ocultarTodos,
} from '#lib/modulos.svelte.js';

mostrarModulo('pantalla1');            // aparece en el menú al instante
ocultarModulo('pantalla1');            // desaparece del menú
alternarModulo('pantalla1');           // invierte su estado
setModuloVisible('pantalla1', true);   // equivalente a mostrar
esModuloVisible('pantalla1');          // true / false (false por defecto)
mostrarTodos();                        // muestra todos
ocultarTodos();                        // oculta todos
```

El menú y sus grupos se filtran solos (`modulosVisibles()`, `grupos()`, `modulosDelGrupo()`). Si el módulo activo se oculta, se vuelve a la pantalla de inicio. El estado es solo en memoria (se reinicia al recargar); se puede alimentar desde cualquier fuente (preferencias, permisos, etc.) sin tocar `Home/+page.svelte`.

En la pantalla de inicio hay una demo con un botón por módulo y atajos "Mostrar todos" / "Ocultar todos"; se puede borrar sin afectar al mecanismo.

## Cambiar el ícono

Reemplaza `app.ico` por tu propio archivo `.ico` (recomendado 256×256 con varias resoluciones embebidas) y vuelve a ejecutar `./compilar.sh`. Solo el ejecutable de Windows muestra el ícono; Linux (ELF) no soporta ícono nativo en el binario.

## Addons nativos (.node)

El proyecto incluye Sequelize + SQLite como ejemplo (`modules/base-datos`). SQLite usa el addon nativo `node_sqlite3.node`, que **no funciona** en un ejecutable compilado si se deja resolver en tiempo de ejecución.

Todo se detecta y empaqueta automáticamente, sin configuración (la idea se tomó del cargador del proyecto `inventario`, pero generalizada):

1. `bun install` ejecuta `postinstall` → `detectar-addons.js` escanea `node_modules` en busca de `*.node`, detecta su plataforma por la cabecera (ELF → Linux, MZ → Windows, Mach-O → macOS) y copia cada binario a `vendor-addons/<plataforma>/` con un nombre único. Genera además:
   - `addons-nativos.js`: metadata (nombre, paquete, plataforma, asset, origen).
   - `addons-assets.sh`: los flags `--asset` para `compilar.sh`.
2. Al arrancar, `addons-native.js` lee los bytes incrustados desde la raíz virtual de Bun (`/$bunfs/root` en Linux, `B:/~BUN/root` en Windows) y los escribe en un directorio temporal (`build/Release/<addon>.node` y también en la raíz del temp), y redirige `bindings.getRoot` ahí. Así `sqlite3` —y cualquier paquete que use `bindings` o un require directo— carga el addon desde el ejecutable. Con `--bytecode`, `import.meta.dir` queda fijado al directorio del build, por eso se usa la raíz virtual explícita (con `import.meta.dir` y la ruta real solo como respaldos).
3. `compilar.sh` genera `app` solo con los addons de Linux y `app.exe` solo con los de Windows. El resultado es independiente: se probó copiando solo `./app` a una carpeta sin `node_modules` y creando/listando notas correctamente, y ejecutando `wine app.exe` (SQLite respondió y guardó notas).

**Windows:** antes de compilar el `.exe`, `compilar.sh` llama a `bun detectar-addons.js --windows --only-win32`. Si el paquete no trae un `.node` de Windows (caso de `sqlite3`, que instala solo el de la plataforma actual), el detector descarga el prebuild oficial desde los releases de GitHub, lo guarda en caché (`node_modules/.cache-addons-win/`) y lo empaqueta como asset. Para otros paquetes se usa cualquier `.node` de Windows que ya exista en `node_modules`; si no hay ninguno, se avisa por consola.

Puedes volver a escanear con `bun run detect:addons` (solo plataforma actual) o `bun detectar-addons.js --windows`. Todos los archivos generados (`addons-nativos.js`, `addons-assets.sh`, `vendor-addons/`) están en `.gitignore`.

## Metadatos del binario

El título, el publicador y el resto de datos que se graban dentro del `.exe` (visibles en *Propiedades > Detalles* de Windows) se leen de `binary.json`:

```json
{
  "titulo": "App",
  "publicador": "TuEmpresa",
  "descripcion": "Aplicación de escritorio",
  "version": "1.0.0",
  "copyright": "© 2026 TuEmpresa"
}
```

`compilar.sh` ya no pasa estos valores a mano: `agregar-icono.js` los toma directamente de `binary.json`. Para cambiarlos, edita ese archivo y vuelve a compilar. `config.json` sigue controlando el nombre/versión mostrados en la GUI; `binary.json` controla los metadatos del ejecutable de Windows.

## Solución de problemas

- **El servidor "se cierra al instante":** casi siempre significa que el puerto 7070 ya está ocupado por otra instancia (por ejemplo, una prueba anterior que quedó corriendo). Verifica con `ss -ltnp | grep 7070` y libera con `fuser -k 7070/tcp`. El proyecto imprime un mensaje claro si esto ocurre:
  ```
  [ERROR] El puerto 7070 ya está en uso.
  Cierra la otra instancia de App o cambia "server.port" en config.json.
  ```
  También puedes cambiar el puerto en `config.json` (`server.port`).

## Notas

- No hay base de datos, ni sesiones, ni login. Agrega lo que necesites en `main.js`.
- Tras cualquier cambio en `main.js` o en `gui/`, ejecuta `./compilar.sh` para que se refleje en el ejecutable.
- El ejecutable de Windows se firma con los metadatos definidos en `binary.json` (`ProductName`, `CompanyName`, etc.).
