import Producto from '../models/productos.js';
import Categoria from '../models/categorias.js';
import Subcategoria from '../models/subcategorias.js';
import { uploadImages, deleteImages } from '../utils/teximage.js';

export const createProducto = async (req, res) => {
  try {
    const { category, subcategory, ...productData } = req.body;

    // Validar categoría
    const categoria = await Categoria.findById(category);
    if (!categoria) {
      return res.status(400).json({ error: 'La categoría no existe' });
    }

    // Validar subcategoría
    const subcatValida = await Subcategoria.findOne({
      _id: subcategory,
      categoriaPadre: categoria.codigo
    });

    if (!subcatValida) {
      return res.status(400).json({ 
        error: 'Subcategoría no válida para esta categoría'
      });
    }

    // Procesar imágenes
    let imagenes = [];
    if (req.files?.length > 0) {
      const results = await uploadImages(req.files);
      imagenes = results.map(result => result.secure_url);
    }

    // Crear producto
    const producto = new Producto({
      ...productData,
      category,
      subcategory,
      imagenes,
      state: '1'
    });

    await producto.save();

    // Respuesta con datos poblados
    const productoPopulado = await Producto.findById(producto._id)
      .populate('category', 'name codigo')
      .populate('subcategory', 'name');

    res.status(201).json(productoPopulado);

  } catch (error) {
    res.status(500).json({ 
      error: 'Error al crear producto',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const getProductos = async (req, res) => {
  try {
    const { 
      category, 
      subcategory, 
      minPrice, 
      maxPrice,
      search,
      sort,
      page = 1,
      limit = 10,
      ...filters
    } = req.query;
    
    const filtro = { state: '1' };

    // Filtros básicos
    if (category) filtro.category = category;
    if (subcategory) filtro.subcategory = subcategory;
    if (minPrice || maxPrice) {
      filtro.precio = {};
      if (minPrice) filtro.precio.$gte = Number(minPrice);
      if (maxPrice) filtro.precio.$lte = Number(maxPrice);
    }

    // Búsqueda por texto
    if (search) {
      filtro.$or = [
        { nombre: { $regex: search, $options: 'i' } },
        { descripcion: { $regex: search, $options: 'i' } },
        { 'especificaciones.modelo': { $regex: search, $options: 'i' } }
      ];
    }

    // Filtros por especificaciones
    if (Object.keys(filters).length > 0) {
      for (const key in filters) {
        if (filters[key]) {
          if (Array.isArray(filters[key])) {
            filtro[`especificaciones.${key}`] = { $in: filters[key] };
          } else {
            filtro[`especificaciones.${key}`] = filters[key];
          }
        }
      }
    }

    // Opciones de ordenamiento
    const sortOptions = {
      'price_asc': { precio: 1 },
      'price_desc': { precio: -1 },
      'newest': { createdAt: -1 },
      'popular': { ventas: -1 },
      'az': { nombre: 1 },
      'za': { nombre: -1 }
    };
    const sortOption = sortOptions[sort] || { createdAt: -1 };

    // Paginación
    const skip = (page - 1) * limit;
    const total = await Producto.countDocuments(filtro);
    const totalPages = Math.ceil(total / limit);

    const productos = await Producto.find(filtro)
      .populate('category', 'name codigo')
      .populate('subcategory', 'name')
      .sort(sortOption)
      .skip(skip)
      .limit(Number(limit));

    res.status(200).json({
      productos,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages
      }
    });

  } catch (error) {
    res.status(500).json({ 
      error: 'Error al obtener productos',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const getProductoById = async (req, res) => {
  try {
    const producto = await Producto.findById(req.params.id)
      .populate('category', 'name codigo')
      .populate('subcategory', 'name');

    if (!producto) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    res.status(200).json(producto);
  } catch (error) {
    res.status(500).json({ 
      error: 'Error al obtener producto',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const updateProducto = async (req, res) => {
  try {
    const { imagenesEliminadas, ...updateData } = req.body;
    const producto = await Producto.findById(req.params.id);

    if (!producto) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    // Eliminar imágenes marcadas
    if (imagenesEliminadas?.length > 0) {
      const publicIds = imagenesEliminadas.map(url => {
        const parts = url.split('/');
        const filename = parts[parts.length - 1];
        return `productos/${filename.split('.')[0]}`;
      });
      await deleteImages(publicIds);
      producto.imagenes = producto.imagenes.filter(img => !imagenesEliminadas.includes(img));
    }

    // Añadir nuevas imágenes
    if (req.files?.length > 0) {
      const results = await uploadImages(req.files);
      producto.imagenes = [...producto.imagenes, ...results.map(r => r.secure_url)];
    }

    // Actualizar otros campos
    Object.keys(updateData).forEach(key => {
      producto[key] = updateData[key];
    });

    await producto.save();

    const productoActualizado = await Producto.findById(req.params.id)
      .populate('category', 'name codigo')
      .populate('subcategory', 'name');

    res.status(200).json(productoActualizado);

  } catch (error) {
    res.status(500).json({ 
      error: 'Error al actualizar producto',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const toggleProductoState = async (req, res) => {
  try {
    const producto = await Producto.findById(req.params.id);
    if (!producto) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    producto.state = producto.state === '1' ? '0' : '1';
    await producto.save();

    res.status(200).json({
      message: `Producto ${producto.state === '1' ? 'activado' : 'desactivado'}`,
      producto
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Error al cambiar estado del producto',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Filtros alfabéticos
export const getFiltrosAlfabeticos = async (req, res) => {
  try {
    const { category } = req.params;
    
    const categoria = await Categoria.findById(category);
    if (!categoria) {
      return res.status(404).json({ error: 'Categoría no encontrada' });
    }

    // Campos disponibles para filtrado alfabético
    const camposFiltrables = ['marca', 'modelo'];

    // Obtener letras disponibles para cada campo
    const filtros = {};
    
    for (const campo of camposFiltrables) {
      const letras = await Producto.aggregate([
        { $match: { category: categoria._id, state: '1' } },
        { $project: { 
          letra: { $substr: [{ $toUpper: `$especificaciones.${campo}` }, 0, 1] } 
        }},
        { $group: { _id: "$letra" } },
        { $sort: { _id: 1 } }
      ]);
      
      filtros[campo] = letras.map(l => l._id).filter(l => l);
    }

    res.status(200).json({
      categoria: categoria.name,
      filtrosAlfabeticos: filtros
    });

  } catch (error) {
    res.status(500).json({ 
      error: 'Error al obtener filtros alfabéticos',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const getProductosPorLetra = async (req, res) => {
  try {
    const { category, campo, letra } = req.params;
    
    if (!/^[A-Za-z]$/.test(letra)) {
      return res.status(400).json({ error: 'La letra debe ser un único carácter A-Z' });
    }

    const categoria = await Categoria.findById(category);
    if (!categoria) {
      return res.status(404).json({ error: 'Categoría no encontrada' });
    }

    const productos = await Producto.find({
      category: categoria._id,
      [`especificaciones.${campo}`]: { $regex: `^${letra}`, $options: 'i' },
      state: '1'
    })
    .select('nombre precio imagenes especificaciones')
    .sort({ nombre: 1 });

    res.status(200).json({
      categoria: categoria.name,
      campo,
      letra: letra.toUpperCase(),
      cantidad: productos.length,
      productos
    });

  } catch (error) {
    res.status(500).json({ 
      error: 'Error al filtrar productos por letra',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export default {
  createProducto,
  getProductos,
  getProductoById,
  updateProducto,
  toggleProductoState,
  getFiltrosAlfabeticos,
  getProductosPorLetra
};