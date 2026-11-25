// Lógica del módulo "ejemplo": sus propias rutas API.
// Se monta en /api desde main.js, igual que api.js.
import express from 'express';

const router = express.Router();
let contador = 0;

router.get('/ejemplo/saludo', (_req, res) => {
  res.json({
    mensaje: 'Hola desde el módulo ejemplo',
    hora: new Date().toISOString(),
  });
});

router.get('/ejemplo/contador', (_req, res) => {
  res.json({ valor: ++contador });
});

export default router;
