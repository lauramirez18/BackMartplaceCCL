import { Router } from 'express';
import {
  inicializarSubcategorias,
  obtenerSubcategorias,
  obtenerPorCategoria,
  cambiarEstado
} from '../controllers/subcategorias.js';

const router = Router();

// Inicialización (ejecutar solo una vez)
router.post('/inicializar', inicializarSubcategorias);

// Obtener todas
router.get('/', obtenerSubcategorias);

// Obtener por categoría padre
router.get('/:categoria', obtenerPorCategoria);

// Cambiar estado
router.put('/estado/:id', cambiarEstado);

export default router;