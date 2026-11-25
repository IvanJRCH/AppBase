import { apiUrl } from './config.js';

export async function peticion(url, opciones) {
  const destino = /^https?:\/\//i.test(url) ? url : apiUrl(url);
  try {
    return await fetch(destino, opciones);
  } catch (error) {
    console.error('Error de conexión:', error);
    throw error;
  }
}
