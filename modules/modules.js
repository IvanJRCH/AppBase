// Módulos del backend: imports estáticos de cada archivo JS.
// Cada módulo exporta un router de Express con sus propias rutas.
//
// Al agregar un módulo con lógica backend:
//   1) crear modules/<nombre>/index.js
//   2) importarlo aquí y agregarlo al arreglo
//
// main.js monta cada router en /api, igual que api.js.

import ejemplo from './ejemplo/index.js';
import servicio from './servicio/index.js';
import baseDatos from './base-datos/index.js';

export const modules = [ejemplo, servicio, baseDatos];

export default modules;
