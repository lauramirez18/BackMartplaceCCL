import { Router } from 'express';
import { check } from 'express-validator';

import {
    createProducto,        
    getProductos,          
    getProductoById,       
    updateProducto,        
    toggleProductoState    
} from '../controllers/productosc.js';  
const router = Router();

// POST: Crear un producto
router.post(
    '/',
    [
      
    ],
    createProducto  // Cambié a createProducto
);

// GET: Listar todos los productos
router.get(
    '/',
    [
       
    ],
    getProductos  // Cambié a getProductos
);

// GET: Obtener un producto por ID
router.get(
    '/:id',
    [
      
    ],
    getProductoById  // Cambié a getProductoById
);

// PUT: Actualizar un producto
router.put(
    "/:id",
    [
      
    ],
    updateProducto  // Cambié a updateProducto
);

// PUT: Cambiar estado de un producto
router.put(
    '/estado/:id',
    [
       
    ],
    toggleProductoState  // Cambié a toggleProductoState
);

export default router;
