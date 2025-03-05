import { Router } from 'express';
import { check } from 'express-validator';
import { validarJWT } from '../middleware/validar-jwt.js';
import { validarCampos } from '../middleware/validar-datos.js';
import {
    createProducto,        // Cambié a createProducto
    getProductos,          // Cambié a getProductos
    getProductoById,       // Cambié a getProductoById
    updateProducto,        // Cambié a updateProducto
    toggleProductoState    // Cambié a toggleProductoState
} from '../controllers/productos.js';  // Cambié la referencia al controlador de productos

const router = Router();

// POST: Crear un producto
router.post(
    '/',
    [
        validarJWT,
        check('nombre', 'El nombre es obligatorio').notEmpty(),
        check('descripcion', 'La descripción es obligatoria').notEmpty(),
        validarCampos
    ],
    createProducto  // Cambié a createProducto
);

// GET: Listar todos los productos
router.get(
    '/',
    [
        validarJWT,
        validarCampos,
    ],
    getProductos  // Cambié a getProductos
);

// GET: Obtener un producto por ID
router.get(
    '/:id',
    [
        validarJWT,
        validarCampos
    ],
    getProductoById  // Cambié a getProductoById
);

// PUT: Actualizar un producto
router.put(
    "/:id",
    [
      validarJWT, 
      check("id", "ID no válido").isMongoId(),
      check("nombre", "El nombre es obligatorio").optional().notEmpty(),
      check("descripcion", "La descripción es obligatoria").optional().notEmpty(),
      validarCampos, 
    ],
    updateProducto  // Cambié a updateProducto
);

// PUT: Cambiar estado de un producto
router.put(
    '/estado/:id',
    [
        validarJWT,
        check('id', 'ID no válido').isMongoId(),
        validarCampos,
    ],
    toggleProductoState  // Cambié a toggleProductoState
);

export default router;
