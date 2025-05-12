import { Router } from 'express';
import {
  createProducto,
  getProductos,
  getProductoById,
  updateProducto,
  toggleProductoState,
  getFiltrosAlfabeticos,
  getProductosPorLetra
} from '../controllers/productosc.js';
import upload from '../middleware/upploads.js';
import { cleanUploads } from '../middleware/upploads.js';

const router = Router();

// Crear nuevo producto
router.post('/', 
  upload.array('imagenes', 5), 
  cleanUploads,
  createProducto
);

// Obtener productos con filtros
router.get('/', getProductos);

// Obtener un producto específico
router.get('/:id', getProductoById);

// Actualizar producto
router.put('/:id',
  upload.array('nuevasImagenes', 5),
  cleanUploads,
  updateProducto
);


router.put('/estado/:id', toggleProductoState);




router.get('/filtros-alfabeticos/:category', getFiltrosAlfabeticos);


router.get('/filtro-alfabetico/:category/:campo/:letra', getProductosPorLetra);

export default router;