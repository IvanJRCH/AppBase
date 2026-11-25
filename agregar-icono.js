// Agrega el icono (y metadatos) a un ejecutable .exe de Windows
// compilado con "bun build --compile" desde Linux.
//
// Requiere (en package.json de la raíz): resedit + pe-library
//
// Los metadatos (titulo, publicador, descripcion, version, copyright) se leen
// de binary.json, en la raíz del proyecto. Esa es la única fuente de datos que
// se graba dentro del binario.
//
// Uso: bun agregar-icono.js <archivo.exe> <icono.ico>
//      (opcionalmente se pueden pasar [titulo] [publicador] para sobrescribir binary.json)
const fs = require('fs');
const path = require('path');
const { NtExecutable, NtExecutableResource, calculateCheckSumForPE } = require('pe-library');
const ResEdit = require('resedit');

const exePath = process.argv[2];
const icoPath = process.argv[3];

if (!exePath || !icoPath) {
  console.error('Uso: bun agregar-icono.js <archivo.exe> <icono.ico> [titulo] [publicador]');
  process.exit(1);
}

// --- Metadatos desde binary.json ---
const rutaBinary = path.resolve(__dirname, 'binary.json');
if (!fs.existsSync(rutaBinary)) {
  console.error(`No se encontró ${rutaBinary}`);
  process.exit(1);
}
const datosBinario = JSON.parse(fs.readFileSync(rutaBinary, 'utf8'));

// Los argumentos opcionales tienen prioridad sobre el archivo.
const titulo = process.argv[4] || datosBinario.titulo || 'App';
const publicador = process.argv[5] || datosBinario.publicador || 'TuEmpresa';
const descripcion = datosBinario.descripcion || `${titulo} — aplicación de escritorio`;
const version = datosBinario.version || '1.0.0';
const copyright = datosBinario.copyright || `© ${new Date().getFullYear()} ${publicador}`;

const roundUp = (v, a) => Math.ceil(v / a) * a;
const NOMBRE_BUN = Buffer.from('.bun\0\0\0\0', 'ascii');
const NOMBRE_RSRC = Buffer.from('.rsrc\0\0\0', 'ascii');
const NOMBRE_RELOC = Buffer.from('.reloc\0\0', 'ascii');

// --- 1) Reordenar secciones del PE (raw y virtualmente) ---
const original = fs.readFileSync(exePath);
const dv0 = new DataView(original.buffer, original.byteOffset, original.byteLength);
const peOff = dv0.getUint32(0x3c, true);
const numSecciones = dv0.getUint16(peOff + 6, true);
const tamOpt = dv0.getUint16(peOff + 20, true);
const opt = peOff + 24;
const tabla = opt + tamOpt;
const secAlign = dv0.getUint32(opt + 32, true);
const fileAlign = dv0.getUint32(opt + 36, true);

const secciones = [];
for (let i = 0; i < numSecciones; i++) {
  const e = tabla + i * 40;
  secciones.push({
    e,
    nombre: Buffer.from(original.buffer, original.byteOffset + e, 8),
    va: dv0.getUint32(e + 12, true),
    vs: dv0.getUint32(e + 8, true),
    rs: dv0.getUint32(e + 16, true),
    pr: dv0.getUint32(e + 20, true),
  });
}

const bun = secciones.find((s) => s.nombre.equals(NOMBRE_BUN));
const rsrc = secciones.find((s) => s.nombre.equals(NOMBRE_RSRC));
const reloc = secciones.find((s) => s.nombre.equals(NOMBRE_RELOC));
if (!bun || !rsrc || !reloc) {
  console.error('No se encontraron las secciones .bun/.rsrc/.reloc');
  process.exit(1);
}

// Nuevo orden: secciones normales (en su orden original), luego .bun,
// luego .rsrc y .reloc al final.
const finales = [...secciones.filter((s) => s !== bun && s !== rsrc && s !== reloc), bun, rsrc, reloc];

// Calcular las nuevas posiciones raw
const finHeaders = roundUp(tabla + numSecciones * 40, fileAlign);
const posiciones = new Map();
let fin = finHeaders;
for (const s of finales) {
  if (s.pr === 0 || s.rs === 0) continue;
  posiciones.set(s, fin);
  fin = roundUp(fin + s.rs, fileAlign);
}
const total = fin;

// Construir el archivo nuevo (buffer aparte, sin solapamientos)
const nuevo = Buffer.alloc(total);
original.copy(nuevo, 0, 0, finHeaders);
for (const s of finales) {
  if (s.pr === 0 || s.rs === 0) continue;
  original.copy(nuevo, posiciones.get(s), s.pr, s.pr + s.rs);
}

// Escribir los nuevos pointer_to_raw_data, virtual_address, directorios y SizeOfImage
const dv = new DataView(nuevo.buffer, nuevo.byteOffset, nuevo.byteLength);
for (const s of finales) {
  if (s.pr === 0 || s.rs === 0) continue;
  dv.setUint32(s.e + 20, posiciones.get(s), true);
}
const vaBunFin = roundUp(bun.va + bun.vs, secAlign);
const vaRsrcOriginal = rsrc.va;
const vaRsrc = vaBunFin;
const vaReloc = roundUp(vaRsrc + rsrc.vs, secAlign);
dv.setUint32(rsrc.e + 12, vaRsrc, true);
dv.setUint32(reloc.e + 12, vaReloc, true);
// Directorios de datos: [2]=Resource, [5]=BaseRelocation
dv.setUint32(opt + 112 + 2 * 8, vaRsrc, true);
dv.setUint32(opt + 112 + 2 * 8 + 4, rsrc.vs, true);
dv.setUint32(opt + 112 + 5 * 8, vaReloc, true);
dv.setUint32(opt + 112 + 5 * 8 + 4, reloc.vs, true);
dv.setUint32(opt + 56, roundUp(vaReloc + reloc.vs, secAlign), true); // SizeOfImage

// Remapear las RVAs internas del arbol de recursos (.rsrc cambio de VA)
const delta = vaRsrc - vaRsrcOriginal;
const offRsrc = posiciones.get(rsrc);
const dvRsrc = new DataView(nuevo.buffer, nuevo.byteOffset + offRsrc, rsrc.rs);
const parchearArbol = (off) => {
  const numNombres = dvRsrc.getUint16(off + 12, true);
  const numIds = dvRsrc.getUint16(off + 14, true);
  let o = off + 16;
  for (let i = 0; i < numNombres + numIds; i++) {
    const destino = dvRsrc.getUint32(o + 4, true);
    if (destino & 0x80000000) parchearArbol(destino & 0x7fffffff);
    else dvRsrc.setUint32(destino, dvRsrc.getUint32(destino, true) + delta, true);
    o += 8;
  }
};
parchearArbol(0);

// --- 2) Reemplazar los iconos con resedit ---
const exe = NtExecutable.from(nuevo);
const res = NtExecutableResource.from(exe);

const iconFile = ResEdit.Data.IconFile.from(fs.readFileSync(icoPath));
const grupos = ResEdit.Resource.IconGroupEntry.fromEntries(res.entries);
const idGrupo = grupos.length > 0 ? grupos[0].id : 1;
ResEdit.Resource.IconGroupEntry.replaceIconsForResource(
  res.entries,
  idGrupo,
  1033,
  iconFile.icons.map((item) => item.data)
);

// Metadatos visibles en Propiedades > Detalles (si el exe tiene VersionInfo)
const versiones = ResEdit.Resource.VersionInfo.fromEntries(res.entries);
if (versiones.length > 0) {
  const vi = versiones[0];
  vi.setFileVersion(version, 1033);
  vi.setProductVersion(version, 1033);
  vi.setStringValues(
    { lang: 1033, codepage: 1200 },
    {
      FileDescription: descripcion,
      ProductName: titulo,
      CompanyName: publicador,
      LegalCopyright: copyright,
    }
  );
  vi.outputToResourceEntries(res.entries);
}

res.outputResource(exe, true); // noGrow: el icono nuevo es mas chico que el de bun
const binario = exe.generate();
calculateCheckSumForPE(binario, true);
fs.writeFileSync(exePath, Buffer.from(binario));
console.log(`Icono "${icoPath}" agregado a ${exePath}`);
console.log(`Metadatos desde binary.json: "${titulo}" / "${publicador}" (v${version})`);
