import { Router } from 'express';
import { check } from 'express-validator';  // Para la validación de los datos
import {
    createProducto,
    getProductos,
    getProductoById,
    updateProducto,
    toggleProductoState,
} from '../controllers/productosc.js'; // Asegúrate de que la ruta es correcta

const router = Router();

// POST: Crear un producto
router.post(
    '/',
    [
        check('name', 'El nombre es obligatorio').not().isEmpty(),
        check('price', 'El precio es obligatorio y debe ser un número').isNumeric(),
        check('stock', 'El stock es obligatorio y debe ser un número entero').isInt(),
        check('description', 'La descripción es obligatoria').not().isEmpty(),
        check('category', 'La categoría es obligatoria').not().isEmpty(),
        check('img', 'La imagen debe ser una URL válida').isURL().optional(),
    ],
    createProducto // Controlador para crear el producto
);

// GET: Listar todos los productos
router.get('/', getProductos);

// GET: Obtener un producto por ID
router.get('/:id', getProductoById);

// PUT: Actualizar un producto
router.put('/:id', updateProducto);

// PUT: Cambiar estado de un producto
router.put('/estado/:id', toggleProductoState);

export default router;
