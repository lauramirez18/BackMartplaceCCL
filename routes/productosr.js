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
  getPriceRange,
 
  setProductoOferta,
  getProductosEnOferta,
  generarOfertasAutomaticas,
  eliminarOfertas,
  getProductoBySlug,
  actualizarSlugs
} from '../controllers/productosc.js';
import upload from '../middleware/upploads.js';
import { cleanUploads } from '../middleware/upploads.js';

const router = Router();

// Ruta para obtener todos los productos
router.get('/', getProductos);

// Crear nuevo producto
router.post('/', 
  upload.array('imagenes', 5), 
  cleanUploads,
  createProducto
);
// Rutas específicas primero
router.get('/ofertas', getProductosEnOferta);
router.get('/filtros-disponibles/:categoryId', getAvailableFilters);
router.get('/rango-precios/:categoryId', getPriceRange);
router.get('/sugerencias-busqueda', getSearchSuggestions);
router.get('/busqueda', searchProducts);
router.get('/filtros-alfabeticos/:category', getFiltrosAlfabeticos);
router.get('/filtro-alfabetico/:category/:campo/:letra', getProductosPorLetra);

// Ruta para actualizar slugs de productos existentes
router.post('/actualizar-slugs', actualizarSlugs);

// Ruta para obtener producto por slug
router.get('/slug/:slug', getProductoBySlug);

// Rutas con parámetros genéricos después
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

// Nuevas rutas para ofertas
router.put('/oferta/:id', setProductoOferta);
router.get('/ofertas', getProductosEnOferta);
router.post('/generar', generarOfertasAutomaticas);
router.post('/eliminar-ofertas', eliminarOfertas);



export default router;

