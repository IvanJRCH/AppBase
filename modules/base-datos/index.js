// Módulo de ejemplo: Sequelize + SQLite sobre el addon nativo node_sqlite3.node.
// La base se guarda en la carpeta temporal del sistema, sin configuración.
import express from 'express';
import os from 'node:os';
import path from 'node:path';

const router = express.Router();

let Nota = null;
let errorBase = null;

try {
  const { Sequelize, DataTypes } = require('sequelize');
  // Requerimiento estático (Bun lo empaqueta) + dialectModule evita el
  // require dinámico que Sequelize hace de "sqlite3" dentro del binario.
  const sqlite3 = require('sqlite3');
  const sequelize = new Sequelize({
    dialect: 'sqlite',
    dialectModule: sqlite3,
    storage: path.join(os.tmpdir(), 'app-base-datos.sqlite'),
    logging: false,
  });

  Nota = sequelize.define(
    'Nota',
    { texto: { type: DataTypes.STRING, allowNull: false } },
    { tableName: 'notas' }
  );
} catch (error) {
  errorBase = error.message;
}

const listo = Nota
  ? Nota.sync().catch((error) => {
      errorBase = error.message;
    })
  : Promise.resolve();

async function modelo() {
  await listo;
  if (!Nota || errorBase) throw new Error(errorBase || 'SQLite no disponible en esta plataforma');
  return Nota;
}

router.get('/base-datos/notas', async (_req, res) => {
  try {
    const notas = await (await modelo()).findAll({ order: [['id', 'DESC']], limit: 20 });
    res.json({ notas });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/base-datos/notas', async (req, res) => {
  try {
    const texto = String(req.body?.texto ?? '').trim();
    if (!texto) return res.status(400).json({ error: 'El texto es obligatorio' });
    const nota = await (await modelo()).create({ texto });
    res.status(201).json({ nota });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
