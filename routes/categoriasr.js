import { Router } from 'express';
import { check } from 'express-validator';

import {
    createCategoria,
    getCategorias,
    getCategoriaById,
    updateCategoria,
    toggleCategoriaState

} from '../controllers/categoriasc.js';

const router = Router();

// POST: Crear una categoría
router.post(
    '/',
    [

        
    ],
    createCategoria
);

// GET: Listar todas las categorías
router.get(
    '/',
  
    getCategorias
);

// GET: Obtener una categoría por ID
router.get(
    '/:id',
  
    getCategoriaById
);

// PUT: Actualizar una categoría
router.put(
    "/:id",
    [
    
    ],
    updateCategoria
  );

router.put(
    '/estado/:id',
    [
      
    ],
    toggleCategoriaState
);

  

export default router;