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
    const productData = req.body;
    productData.imagenes = imagenes;

    // 4. Crear producto
    const producto = new Producto({
      ...productData,
      category,
      subcategory,
      imagenes,
      state: '1'
    });
    await producto.save();

    // 5. Poblar datos para la respuesta
    const productoPopulado = await Producto.findById(producto._id)
    .populate('category', 'name codigo')
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
    const { 
      category, 
      subcategory, 
      minPrice, 
      maxPrice, 
      search, 
      sort, 
      page = 1, 
      limit = 10, 
      format = 'detailed', 
            ...filters 
    } = req.query;
    
    const filtro = { state: '1' };

    
    if (category) filtro.category = category;
    if (subcategory) filtro.subcategory = subcategory;
    if (minPrice || maxPrice) {
      filtro.precio = {};
      if (minPrice) filtro.precio.$gte = Number(minPrice);
      if (maxPrice) filtro.precio.$lte = Number(maxPrice);
    }

 
    if (search) {
      filtro.$or = [
        { nombre: { $regex: search, $options: 'i' } },
        { descripcion: { $regex: search, $options: 'i' } },
        { 'especificaciones.modelo': { $regex: search, $options: 'i' } }
      ];
    }

   
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


    const sortOptions = {
      'price_asc': { precio: 1 },
      'price_desc': { precio: -1 },
      'newest': { createdAt: -1 },
      'popular': { ventas: -1 },
      'az': { nombre: 1 },
      'za': { nombre: -1 }
    };
    const sortOption = sortOptions[sort] || { createdAt: -1 };

    
    let query = Producto.find(filtro);
    
   
    query = query.populate('category', 'name codigo')
                 .populate('subcategory', 'name')
                 .sort(sortOption);
    
 
    if (format === 'detailed') {
      const skip = (page - 1) * limit;
      const total = await Producto.countDocuments(filtro);
      const totalPages = Math.ceil(total / limit);
      
      query = query.skip(skip).limit(Number(limit));
      
      const productos = await query;
      
      return res.status(200).json({
        productos,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages
        }
      });
    } else {
    
      const productos = await query;
      return res.status(200).json(productos);
    }
  } catch (error) {
    return res.status(500).json({ 
      error: 'Error al obtener productos', 
      details: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
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
// Obtener filtros disponibles para una categoría
export const getAvailableFilters = async (req, res) => {
  try {
    const { categoryId } = req.params;
    
    const categoria = await Categoria.findById(categoryId);
    if (!categoria) {
      return res.status(404).json({ error: "Categoría no encontrada" });
    }

    // Obtener todos los productos de esta categoría
    const productos = await Producto.find({ 
      category: categoryId,
      state: '1'
    });

    // Extraer todas las especificaciones únicas
    const filters = {};
    
    productos.forEach(producto => {
      if (producto.especificaciones) {
        Object.keys(producto.especificaciones).forEach(key => {
          if (!filters[key]) filters[key] = new Set();
          if (producto.especificaciones[key]) {
            filters[key].add(producto.especificaciones[key]);
          }
        });
      }
    });

    // Convertir sets a arrays y formatear para el frontend
    const formattedFilters = {};
    Object.keys(filters).forEach(key => {
      if (filters[key].size > 0) {
        formattedFilters[key] = Array.from(filters[key]).map(value => ({
          label: value,
          value: value
        }));
      }
    });

    res.status(200).json({
      categoria: categoria.name,
      filters: formattedFilters
    });

  } catch (error) {
    res.status(500).json({ 
      error: "Error al obtener filtros",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Obtener rango de precios para una categoría
export const getPriceRange = async (req, res) => {
  try {
    const { categoryId } = req.params;
    
    const result = await Producto.aggregate([
      { $match: { category: mongoose.Types.ObjectId(categoryId), state: '1' } },
      { $group: {
          _id: null,
          min: { $min: "$precio" },
          max: { $max: "$precio" }
      }}
    ]);

    if (result.length === 0) {
      return res.status(200).json({ min: 0, max: 1000000 });
    }

    res.status(200).json({
      min: Math.floor(result[0].min / 10000) * 10000, // Redondear hacia abajo
      max: Math.ceil(result[0].max / 10000) * 10000  // Redondear hacia arriba
    });

  } catch (error) {
    res.status(500).json({ 
      error: "Error al obtener rango de precios",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
export default {
  createProducto,
  getProductos,
  getProductoById,
  getProductosPorLetra,
  updateProducto,
  getFiltrosAlfabeticos,
  toggleProductoState,
  getPriceRange,
  getAvailableFilters, 
};