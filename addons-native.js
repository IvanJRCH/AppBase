// Prepara los addons nativos incrustados en el ejecutable.
//
// Los .node se empaquetan como --asset (vendor-addons/<plataforma>/). Al
// arrancar se copian a un directorio temporal y se redirige `bindings.getRoot`
// hacia él, igual que hace el proyecto "inventario" para Windows. Así sqlite3
// y cualquier paquete que use `bindings` carga el addon desde el ejecutable.
const fs = require('fs');
const os = require('os');
const path = require('path');
const { addons } = require('./addons-nativos.js');

let raizPreparada = null;

// En el binario compilado, --asset deja los bytes en la raíz virtual
// (import.meta.dir). En desarrollo se lee vendor-addons/ desde __dirname.
function rutaDeAsset(addon) {
  // Con --bytecode, import.meta.dir queda fijado al directorio del build, así
  // que hay que probar la raíz virtual de Bun primero (distinto en Windows).
  const raizVirtual = process.platform === 'win32' ? 'B:/~BUN/root' : '/$bunfs/root';
  const candidatas = [
    path.join(raizVirtual, addon.asset),
    path.join(import.meta.dir, addon.asset),
    path.resolve(__dirname, addon.origen),
  ];
  for (const candidata of candidatas) {
    try {
      if (fs.existsSync(candidata)) return candidata;
    } catch {
      // siguiente candidata
    }
  }
  return candidatas[candidatas.length - 1];
}

function prepararAddons() {
  if (raizPreparada !== null) return raizPreparada;

  const compatibles = addons.filter(
    (addon) => addon.plataforma === 'all' || addon.plataforma === process.platform
  );

  if (compatibles.length === 0) {
    raizPreparada = '';
    return raizPreparada;
  }

  const raiz = fs.mkdtempSync(path.join(os.tmpdir(), 'app-addons-'));
  fs.writeFileSync(path.join(raiz, 'package.json'), '{}');

  for (const addon of compatibles) {
    const bytes = fs.readFileSync(rutaDeAsset(addon));
    const destinos = [
      path.join(raiz, 'build', 'Release', addon.nombre), // para `bindings`
      path.join(raiz, addon.nombre),                     // para require directo
    ];
    for (const destino of destinos) {
      fs.mkdirSync(path.dirname(destino), { recursive: true });
      fs.writeFileSync(destino, bytes);
    }
  }

  try {
    const bindings = require('bindings');
    if (bindings && typeof bindings.getRoot === 'function') {
      bindings.getRoot = () => raiz;
    }
  } catch {
    // El proyecto no usa `bindings`: los require directos ya funcionan solos.
  }

  raizPreparada = raiz;
  return raizPreparada;
}

module.exports = { prepararAddons };

// Se ejecuta al importar el módulo: garantiza que cualquier paquete que se
// cargue después (sequelize, sqlite3, ...) ya vea los addons disponibles.
prepararAddons();
