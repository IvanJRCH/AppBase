// API de ejemplo de la base (sin autenticación).
// Se monta en /api desde main.js. Los módulos pueden agregar sus propias
// rutas usando el router "api" que reciben en registrar({ api, app, modulo }).
const express = require('express');

const router = express.Router();

router.get('/ping', (_req, res) => {
  res.json({ ok: true, mensaje: 'pong', servidor: 'app' });
});

router.get('/datos', (_req, res) => {
  res.json({
    titulo: 'Pantalla 1',
    items: [
      { id: 1, nombre: 'Elemento de ejemplo', valor: 100 },
      { id: 2, nombre: 'Segundo elemento', valor: 250 },
      { id: 3, nombre: 'Tercer elemento', valor: 400 },
    ],
  });
});

module.exports = router;
