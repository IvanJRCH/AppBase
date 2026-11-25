// Módulo solo backend: no tiene carpeta gui/, por eso no aparece en el menú.
import express from 'express';

const router = express.Router();

router.get('/servicio/estado', (_req, res) => {
  res.json({
    modulo: 'servicio',
    activo: true,
    hora: new Date().toISOString(),
  });
});

export default router;
