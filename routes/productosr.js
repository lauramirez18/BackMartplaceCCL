import { Router } from 'express';
import {
    createProducto,
    getProductos,
    getProductoById,
    updateProducto,
    toggleProductoState,
    getProductosByCategory,
    getProductosByStock,
    searchProductos
} from '../controllers/productosc.js';

const router = Router();


router.post('/', createProducto);


router.get('/', getProductos);


router.get('/buscar', searchProductos);


router.get('/:id', getProductoById);


router.get('/categoria/:category', getProductosByCategory);


router.get('/bajo-stock/:stock', getProductosByStock);


router.put('/:id', updateProducto);


router.put('/estado/:id', toggleProductoState);

export default router;