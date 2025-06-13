import { Router } from 'express';
import {
  createCategoria,
  getCategorias,
  getCategoriaById,
  getEspecificacionesByCategoria,
  updateCategoria,
  toggleCategoriaState,
  getCategoriaBySlug,
  actualizarSlugs
} from '../controllers/categoriasc.js';

const router = Router();

router.post('/', createCategoria);
router.get('/', getCategorias);
router.get('/:id', getCategoriaById); 
router.get('/:codigo/especificaciones', getEspecificacionesByCategoria);
router.put('/:id', updateCategoria);
router.put('/estado/:id', toggleCategoriaState);

// Nuevas rutas para slugs
router.get('/slug/:slug', getCategoriaBySlug);
router.post('/actualizar-slugs', actualizarSlugs);

export default router;