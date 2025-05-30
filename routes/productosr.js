import { Router } from 'express';
import {
  createProducto,
  getProductos,
  getProductoById,
  updateProducto,
  toggleProductoState,
  getFiltrosAlfabeticos,
  getProductosPorLetra,
  getSearchSuggestions,
  searchProducts,
  getAvailableFilters,
  getPriceRange
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
router.get('/filtros-disponibles/:categoryId', getAvailableFilters);
router.get('/rango-precios/:categoryId', getPriceRange);
router.get('/sugerencias-busqueda', getSearchSuggestions);
router.get('/busqueda', searchProducts);
// Obtener productos con filtros
router.get('/', getProductos);

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