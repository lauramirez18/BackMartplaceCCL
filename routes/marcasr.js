import { Router } from 'express';
import {
  createMarca,
  getMarcas,
  getMarcaById,
  getMarcaBySlug,
  updateMarca,
  toggleMarcaState,
  actualizarSlugs
} from '../controllers/marcasc.js';

const router = Router();

// Rutas específicas primero
router.get('/slug/:slug', getMarcaBySlug);
router.post('/actualizar-slugs', actualizarSlugs);

// Rutas generales
router.post('/', createMarca);
router.get('/', getMarcas);
router.get('/:id', getMarcaById);
router.put('/:id', updateMarca);
router.put('/estado/:id', toggleMarcaState);

export default router;