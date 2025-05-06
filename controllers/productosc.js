import Producto from '../models/productos.js';
import Categoria from '../models/categorias.js';
import Subcategoria from '../models/subcategorias.js';

export const createProducto = async (req, res) => {
  try {
    const { category, subcategory, detalles } = req.body;

    // Validar relación categoría-subcategoría
    const subcatValida = await Subcategoria.findOne({
      _id: subcategory,
      categoriaPadre: category
    });

    if (!subcatValida) {
      return res.status(400).json({ error: 'Subcategoría no válida para esta categoría' });
    }

    // Validar detalles técnicos
    const categoria = await Categoria.findById(category);
    const schema = especificacionesSchema[categoria.codigo];

    if (schema) {
      const { error } = schema.validate(detalles);
      if (error) {
        return res.status(400).json({ 
          error: `Error en especificaciones: ${error.details[0].message}`
        });
      }
    }

    // Crear producto
    const producto = new Producto({
      ...req.body,
      state: '1'
    });

    await producto.save();

    // Respuesta con datos poblados
    const productoPopulado = await Producto.findById(producto._id)
      .populate('category', 'name')
      .populate('subcategory', 'name');

    res.status(201).json(productoPopulado);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Obtener todos los productos (con filtros)
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

// Obtener producto por ID
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

// Actualizar producto
export const updateProducto = async (req, res) => {
  try {
    const { detalles } = req.body;

    // Validar detalles si existen
    if (detalles) {
      const producto = await Producto.findById(req.params.id).populate('category');
      const schema = especificacionesSchema[producto.category.codigo];

      if (schema) {
        const { error } = schema.validate(detalles);
        if (error) {
          return res.status(400).json({ error: error.details[0].message });
        }
      }
    }

    const productoActualizado = await Producto.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    )
    .populate('category', 'name')
    .populate('subcategory', 'name');

    res.status(200).json(productoActualizado);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Cambiar estado del producto
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