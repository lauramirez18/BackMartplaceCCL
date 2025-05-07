import { Router } from 'express';
import {
    createProducto,
    getProductos,
    getProductoById,
    updateProducto,
    toggleProductoState,
   
    
} from '../controllers/productosc.js';
import upload from '../middleware/upploads.js';
import { cleanUploads } from '../middleware/upploads.js';
const router = Router();


router.post('/', 
    upload.array('imagenes', 5), 
    cleanUploads,
    createProducto
  );
  
 
  router.put('/:id',
    upload.array('nuevasImagenes', 5),
    cleanUploads,
    updateProducto
  );


router.get('/', getProductos);




router.get('/:id', getProductoById);








router.put('/estado/:id', toggleProductoState);

export default router;