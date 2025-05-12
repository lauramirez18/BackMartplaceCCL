import { Router } from 'express';
import {
  createCategoria,
  getCategorias,
  getEspecificacionesByCategoria,
  updateCategoria,
  toggleCategoriaState
} from '../controllers/categoriasc.js';

const router = Router();


router.post('/', createCategoria);


router.get('/', getCategorias);


router.get('/:codigo/especificaciones', getEspecificacionesByCategoria);


router.put('/:id', updateCategoria);


router.put('/estado/:id', toggleCategoriaState);

export default router;