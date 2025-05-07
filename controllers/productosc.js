import Producto from '../models/productos.js';
import Categoria from '../models/categorias.js';
import Subcategoria from '../models/subcategorias.js';
import { uploadImages, deleteImages } from '../utils/teximage.js';

export const createProducto = async (req, res) => {
  try {
    const { category, subcategory } = req.body;

    // 1. Obtener el código de la categoría (enviar código desde el frontend)
    const categoria = await Categoria.findById(category);
    if (!categoria) {
      return res.status(400).json({ error: 'La categoría no existe' });
    }

    // 2. Validar que la subcategoría pertenezca a la categoría (por código)
    const subcatValida = await Subcategoria.findOne({
      _id: subcategory,
      categoriaPadre: categoria.codigo  // Compara con el código, no con el ID
    });

    if (!subcatValida) {
      return res.status(400).json({ 
        error: 'Subcategoría no válida para esta categoría',
        details: `La subcategoría no está asociada a ${categoria.name} (${categoria.codigo})`
      });
    }


    // 3. Subir imágenes (tu código actual está correcto)
    let imagenes = [];
    if (req.files && req.files.length > 0) {
      const results = await uploadImages(req.files);
      imagenes = results.map(result => result.secure_url);
    }

    // 4. Crear producto
    const producto = new Producto({
      ...req.body,
      imagenes,
      state: '1'
    });

    await producto.save();

    // 5. Poblar datos para la respuesta
    const productoPopulado = await Producto.findById(producto._id)
      .populate('category', 'name')
      .populate('subcategory', 'name');

    res.status(201).json(productoPopulado);

  } catch (error) {
    // Mejora el manejo de errores
    console.error('Error en createProducto:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const getProductos = async (req, res) => {
  try {
    const { category, subcategory, minPrice, maxPrice } = req.query;
    const filtro = { state: '1' };

    if (category) filtro.category = category;
    if (subcategory) filtro.subcategory = subcategory;
    if (minPrice || maxPrice) {
      filtro.precio = {};
      if (minPrice) filtro.precio.$gte = Number(minPrice);
      if (maxPrice) filtro.precio.$lte = Number(maxPrice);
    }

    const productos = await Producto.find(filtro)
      .populate('category', 'name')
      .populate('subcategory', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json(productos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getProductoById = async (req, res) => {
  try {
    const producto = await Producto.findById(req.params.id)
      .populate('category', 'name')
      .populate('subcategory', 'name');

    if (!producto) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    res.status(200).json(producto);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateProducto = async (req, res) => {
  try {
    const { imagenesEliminadas } = req.body;
    const producto = await Producto.findById(req.params.id);

    if (!producto) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    // Eliminar imágenes marcadas
    if (imagenesEliminadas && imagenesEliminadas.length > 0) {
      const publicIds = imagenesEliminadas.map(url => {
        const parts = url.split('/');
        const filename = parts[parts.length - 1];
        return `productos/${filename.split('.')[0]}`;
      });
      await deleteImages(publicIds);
      producto.imagenes = producto.imagenes.filter(img => !imagenesEliminadas.includes(img));
    }

    // Añadir nuevas imágenes
    if (req.files && req.files.length > 0) {
      const results = await uploadImages(req.files);
      const nuevasUrls = results.map(result => result.secure_url);
      producto.imagenes = [...producto.imagenes, ...nuevasUrls];
    }

    // Actualizar otros campos
    Object.keys(req.body).forEach(key => {
      if (key !== 'imagenesEliminadas' && key !== 'imagenes') {
        producto[key] = req.body[key];
      }
    });

    await producto.save();

    const productoActualizado = await Producto.findById(req.params.id)
      .populate('category', 'name')
      .populate('subcategory', 'name');

    res.status(200).json(productoActualizado);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const toggleProductoState = async (req, res) => {
  try {
    const producto = await Producto.findById(req.params.id);
    producto.state = producto.state === '1' ? '0' : '1';
    await producto.save();
    res.status(200).json(producto);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export default {
  createProducto,
  getProductos,
  getProductoById,
  updateProducto,
  toggleProductoState
};