import { Router } from 'express';
import {
  createCategoria,
  getCategorias,
  getCategoriaById, // Add this new import
  getEspecificacionesByCategoria,
  updateCategoria,
  toggleCategoriaState
} from '../controllers/categoriasc.js';

const router = Router();

router.post('/', createCategoria);
router.get('/', getCategorias);
router.get('/:id', getCategoriaById); // Add this new route
router.get('/:codigo/especificaciones', getEspecificacionesByCategoria);
router.put('/:id', updateCategoria);
router.put('/estado/:id', toggleCategoriaState);

export default router;