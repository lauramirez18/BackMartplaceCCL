import { Router } from 'express';
import {
    createProducto,
    getProductos,
    getProductoById,
    updateProducto,
    toggleProductoState,
   
    
} from '../controllers/productosc.js';

const router = Router();


router.post('/', createProducto);


router.get('/', getProductos);




router.get('/:id', getProductoById);





router.put('/:id', updateProducto);


router.put('/estado/:id', toggleProductoState);

export default router;