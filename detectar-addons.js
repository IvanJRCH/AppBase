// Detecta automáticamente los addons nativos (.node) usados por el proyecto y
// genera todo lo necesario para empaquetarlos en los ejecutables:
//
//   vendor-addons/<plataforma>/<asset>.node  -> bytes que Bun incrusta con --asset
//   addons-nativos.js                        -> metadata que consume addons-native.js
//   addons-assets.sh                         -> flags --asset para compilar.sh
//
// Con --windows además busca (o descarga) el prebuild de Windows cuando el
// paquete solo trae el .node de la plataforma actual (caso típico de sqlite3).
//
// Se ejecuta desde postinstall (sin red) y desde compilar.sh (con --windows).
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const raiz = __dirname;
const nodeModules = path.join(raiz, 'node_modules');
const vendor = path.join(raiz, 'vendor-addons');
const quiereWindows = process.argv.includes('--windows');

function plataformaDe(ruta) {
  try {
    const fd = fs.openSync(ruta, 'r');
    const cabecera = Buffer.alloc(4);
    fs.readSync(fd, cabecera, 0, 4, 0);
    fs.closeSync(fd);

    if (cabecera[0] === 0x7f && cabecera.toString('ascii', 1, 4) === 'ELF') return 'linux';
    if (cabecera[0] === 0x4d && cabecera[1] === 0x5a) return 'win32'; // MZ
    if (cabecera.toString('hex', 0, 4).match(/^(cffaedfe|feedfacf|cafebabe)$/)) return 'darwin';
  } catch {
    // Si no se puede leer, se trata como compatible con cualquier plataforma.
  }
  return 'all';
}

function buscar(ruta, lista) {
  if (!fs.existsSync(ruta)) return;
  for (const entrada of fs.readdirSync(ruta, { withFileTypes: true })) {
    if (entrada.name === '.bin' || entrada.name.startsWith('.cache-addons')) continue;
    const completa = path.join(ruta, entrada.name);
    if (entrada.isDirectory()) buscar(completa, lista);
    else if (entrada.name.endsWith('.node')) lista.push(completa);
  }
}

function paqueteDe(rutaAbsoluta) {
  const relativa = path.relative(nodeModules, rutaAbsoluta).split(path.sep);
  return relativa[0].startsWith('@') ? relativa.slice(0, 2).join('/') : relativa[0];
}

// Los .node de Windows que el bundler no puede cargar directamente se
// descargan de los releases del paquete. Hoy se conoce el patrón de sqlite3;
// otros paquetes se resuelven si ya traen un .node de Windows en node_modules.
function prebuildWindows(paquete, version) {
  if (paquete !== 'sqlite3') return null;

  const napi = Math.max(...(require(path.join(nodeModules, paquete, 'package.json')).binary?.napi_versions ?? [6]));
  const nombre = `sqlite3-v${version}-napi-v${napi}-win32-x64.tar.gz`;
  const url = `https://github.com/TryGhost/node-sqlite3/releases/download/v${version}/${nombre}`;
  const cache = path.join(nodeModules, '.cache-addons-win', `sqlite3-${version}`);
  const marcador = path.join(cache, '.version');

  try {
    if (!fs.existsSync(marcador) || fs.readFileSync(marcador, 'utf8') !== version) {
      console.log(`[addons] descargando prebuild de Windows para ${paquete}@${version}...`);
      fs.mkdirSync(cache, { recursive: true });
      execFileSync('curl', ['-sL', '-o', path.join(cache, 'addon.tar.gz'), url], { stdio: 'pipe' });
      execFileSync('tar', ['xzf', path.join(cache, 'addon.tar.gz'), '-C', cache], { stdio: 'pipe' });
      fs.writeFileSync(marcador, version);
    }
    const binario = path.join(cache, 'build', 'Release', 'node_sqlite3.node');
    return fs.existsSync(binario) ? binario : null;
  } catch (error) {
    console.warn(`[addons] no se pudo descargar el prebuild de Windows: ${error.message}`);
    return null;
  }
}

// --- 1) Recoger los .node locales ---
const locales = [];
buscar(nodeModules, locales);

const encontrados = [];
for (const ruta of locales) {
  encontrados.push({
    ruta,
    nombre: path.basename(ruta),
    paquete: paqueteDe(ruta),
    plataforma: plataformaDe(ruta),
  });
}

// --- 2) Variante de Windows ---
if (quiereWindows) {
  const vistos = new Set(
    encontrados.filter((a) => a.plataforma === 'win32').map((a) => `${a.paquete}:${a.nombre}`)
  );
  const candidatos = encontrados.filter((a) => ['linux', 'darwin', 'all'].includes(a.plataforma));

  for (const addon of candidatos) {
    const clave = `${addon.paquete}:${addon.nombre}`;
    if (vistos.has(clave)) continue;
    const version = require(path.join(nodeModules, addon.paquete, 'package.json')).version;
    const binario = prebuildWindows(addon.paquete, version);
    if (binario) {
      encontrados.push({
        ruta: binario,
        nombre: addon.nombre,
        paquete: addon.paquete,
        plataforma: 'win32',
      });
      vistos.add(clave);
    }
  }
}

// Al compilar el .exe solo se necesitan los binarios de Windows.
const paraGenerar = process.argv.includes('--only-win32')
  ? encontrados.filter((a) => a.plataforma === 'win32' || a.plataforma === 'all')
  : encontrados;

// --- 3) Copiar cada addon a vendor-addons/<plataforma>/ con nombre único ---
fs.rmSync(vendor, { recursive: true, force: true });
const addons = [];
const banderas = [];

for (const addon of paraGenerar) {
  const asset = `${addon.paquete}__${addon.plataforma}__${addon.nombre}`;
  const destino = path.join(vendor, addon.plataforma, asset);
  fs.mkdirSync(path.dirname(destino), { recursive: true });
  fs.copyFileSync(addon.ruta, destino);

  addons.push({
    nombre: addon.nombre,
    paquete: addon.paquete,
    plataforma: addon.plataforma,
    asset,
    origen: './vendor-addons/' + addon.plataforma + '/' + asset,
  });
  banderas.push(`--asset "./vendor-addons/${addon.plataforma}/${asset}"`);
}

// --- 4) Generar metadata y flags ---
fs.writeFileSync(
  path.join(raiz, 'addons-nativos.js'),
  [
    '// ARCHIVO GENERADO AUTOMATICAMENTE POR detectar-addons.js - NO EDITAR',
    `// ${addons.length} addon(es) incrustado(s).`,
    '',
    'const addons = ' + JSON.stringify(addons, null, 2) + ';',
    '',
    'module.exports = { addons };',
    '',
  ].join('\n')
);

fs.writeFileSync(
  path.join(raiz, 'addons-assets.sh'),
  [
    '# ARCHIVO GENERADO AUTOMATICAMENTE POR detectar-addons.js - NO EDITAR',
    `ADDON_ASSETS=(${banderas.join(' ')})`,
    '',
  ].join('\n')
);

console.log(`[addons] ${addons.length} addon(es) listo(s) para empaquetar:`);
for (const addon of addons) console.log(`  - ${addon.paquete}/${addon.nombre} (${addon.plataforma})`);
if (quiereWindows && !addons.some((a) => a.plataforma === 'win32')) {
  console.log('[addons] AVISO: sin addon de Windows; el .exe no tendrá esa dependencia nativa.');
}
