// Módulos con interfaz: imports estáticos de cada componente Svelte.
// Esta lista alimenta el menú de Home. Los módulos solo backend
// (como modules/servicio) no se importan aquí porque no tienen GUI.
//
// Al agregar un módulo con GUI:
//   1) crear modules/<nombre>/gui/<Componente>.svelte
//   2) importarlo aquí y agregar su entrada al arreglo
//
// La visibilidad es reactiva: ocultar/mostrar un módulo actualiza el menú
// al instante, desde cualquier componente que llame a estas funciones.

import Pantalla1 from '../../../modules/pantalla1/gui/Pantalla1.svelte';
import Pantalla2 from '../../../modules/pantalla2/gui/Pantalla2.svelte';
import Ejemplo from '../../../modules/ejemplo/gui/Ejemplo.svelte';
import BaseDatos from '../../../modules/base-datos/gui/BaseDatos.svelte';

export const modulos = [
  {
    name: 'pantalla1',
    label: 'Pantalla 1',
    grupo: 'Principal',
    icono: 'M4 6h16M4 12h16M4 18h16',
    Componente: Pantalla1,
  },
  {
    name: 'pantalla2',
    label: 'Pantalla 2',
    grupo: 'Principal',
    icono: 'M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z',
    Componente: Pantalla2,
  },
  {
    name: 'ejemplo',
    label: 'Módulo ejemplo',
    grupo: 'Módulos',
    icono: 'M12 2 2 7l10 5 10-5-10-5M2 17l10 5 10-5M2 12l10 5 10-5',
    Componente: Ejemplo,
  },
  {
    name: 'base-datos',
    label: 'Base de datos',
    grupo: 'Módulos',
    icono: 'M4 7h16M4 12h16M4 17h16',
    Componente: BaseDatos,
  },
];

// --- Visibilidad (estado compartido, en memoria) ---
// Por defecto TODO está oculto: solo se muestra lo que se marcó explícitamente.
const visibilidad = $state({});

export function ocultarModulo(name) {
  visibilidad[name] = false;
}

export function mostrarModulo(name) {
  visibilidad[name] = true;
}

export function alternarModulo(name) {
  esModuloVisible(name) ? ocultarModulo(name) : mostrarModulo(name);
}

export function setModuloVisible(name, visible) {
  visible ? mostrarModulo(name) : ocultarModulo(name);
}

export function esModuloVisible(name) {
  return visibilidad[name] === true;
}

export function mostrarTodos() {
  for (const modulo of modulos) visibilidad[modulo.name] = true;
}

export function ocultarTodos() {
  for (const modulo of modulos) visibilidad[modulo.name] = false;
}

// --- Listas que consume el menú (se recalculan al cambiar "visibilidad") ---
export function modulosVisibles() {
  return modulos.filter((m) => esModuloVisible(m.name));
}

export function grupos() {
  return [...new Set(modulosVisibles().map((m) => m.grupo))];
}

export function modulosDelGrupo(grupo) {
  return modulosVisibles().filter((m) => m.grupo === grupo);
}
