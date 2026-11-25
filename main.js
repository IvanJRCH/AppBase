const express = require('express');
const path = require('path');
const os = require('os');

const app = express();
const configuracion = require('./config.json');
const api = require('./api.js');
// Al importarlo, addons-native.js prepara los .node incrustados ANTES de que
// los módulos carguen sequelize/sqlite3.
require('./addons-native.js');
const { abrirNavegador } = require('./abrir-navegador.js');

const { modules } = require('./modules/modules.js');

const host = configuracion.server?.host || '0.0.0.0';
const port = Number(configuracion.server?.port) || 7070;
const abrirAlIniciar = configuracion.server?.abrirNavegador !== false;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==========================================
// API base de ejemplo (api.js) + API de cada módulo (imports estáticos)
// ==========================================
app.use('/api', api);
for (const modulo of modules) app.use('/api', modulo);

// ==========================================
// Servir la GUI compilada (SvelteKit, adapter-static)
// ==========================================
app.use(express.static(path.join(__dirname, 'gui/build')));

// Catch-all para el router hash de Svelte: cualquier ruta devuelve index.html
app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, 'gui/build', 'index.html'));
});

function direccionesLocales() {
  return Object.values(os.networkInterfaces())
    .flat()
    .filter((interfaz) => interfaz && interfaz.family === 'IPv4' && !interfaz.internal)
    .map((interfaz) => interfaz.address);
}

const servidor = app.listen(port, host, (err) => {
  // Express 5 registra este callback también como manejador de 'error':
  // si falla el enlace (p. ej. puerto ocupado) lo invoca con el error.
  // El manejador 'error' de abajo se encarga de informar y terminar.
  if (err) return;

  const hostLocal = host === '0.0.0.0' ? '127.0.0.1' : host;
  const urlLocal = `http://${hostLocal}:${port}`;

  console.log(`App escuchando en ${urlLocal}`);

  if (abrirAlIniciar) abrirNavegador(urlLocal);

  if (host === '0.0.0.0') {
    for (const ip of direccionesLocales()) {
      console.log(`Accesible desde la red local en http://${ip}:${port}`);
    }
  }
});

// Sin este manejador, Bun silencia errores de escucha (p. ej. EADDRINUSE)
// y el proceso termina al instante con código 0 sin avisar.
servidor.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n[ERROR] El puerto ${port} ya está en uso.`);
    console.error('Cierra la otra instancia de App o cambia "server.port" en config.json.\n');
  } else {
    console.error(`\n[ERROR] No se pudo iniciar el servidor: ${err.message}\n`);
  }
  process.exit(1);
});
