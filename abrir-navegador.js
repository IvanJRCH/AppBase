// Abre una URL en el navegador por defecto del sistema.
// Se usa al iniciar el servidor; si falla (equipo sin escritorio, por ejemplo),
// solo imprime la URL para que se abra manualmente.
const { spawn } = require('child_process');

function candidatos(url) {
  if (process.platform === 'win32') {
    return [{ comando: 'cmd', args: ['/c', 'start', '""', url] }];
  }
  if (process.platform === 'darwin') {
    return [{ comando: 'open', args: [url] }];
  }
  return [
    { comando: 'xdg-open', args: [url] },
    { comando: 'gio', args: ['open', url] },
  ];
}

function intentar(lista, url) {
  if (lista.length === 0) {
    console.warn(`[navegador] No se pudo abrir automáticamente. Abre manualmente: ${url}`);
    return;
  }

  const { comando, args } = lista[0];
  const proceso = spawn(comando, args, {
    detached: true,
    stdio: 'ignore',
    windowsHide: true,
  });

  proceso.once('error', () => intentar(lista.slice(1), url));
  proceso.unref();
}

function abrirNavegador(url) {
  try {
    intentar(candidatos(url), url);
  } catch (error) {
    console.warn(`[navegador] No se pudo abrir automáticamente: ${error.message}`);
    console.warn(`[navegador] Abre manualmente: ${url}`);
  }
}

module.exports = { abrirNavegador };
