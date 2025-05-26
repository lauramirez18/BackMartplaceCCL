
import mongoose from 'mongoose';
import Producto from '../models/productos.js';
import Categoria from '../models/categorias.js';
import Subcategoria from '../models/subcategorias.js';
import { uploadImages, deleteImages } from '../utils/teximage.js';
import { especificacionesCategorias } from '../utils/especificaciones.js';

export const createProducto = async (req, res) => {
  try {
    const { category, subcategory, especificaciones, ...productData } = req.body;
    if (!mongoose.Types.ObjectId.isValid(category) || !mongoose.Types.ObjectId.isValid(subcategory)) {
      return res.status(400).json({ message: 'IDs de categoría o subcategoría inválidos.' });
    }
    const categoria = await Categoria.findById(category);
    if (!categoria) {
      return res.status(400).json({ message: 'La categoría especificada no existe.' });
    }
    const subcatValida = await Subcategoria.findOne({
      _id: subcategory,
      categoriaPadre: categoria.codigo 
    });

    if (!subcatValida) {
      return res.status(400).json({
        message: 'Subcategoría no válida para esta categoría.',
        details: `La subcategoría no está asociada a ${categoria.name} (${categoria.codigo}).`
      });
    }

  
    let processedEspecificaciones = {};
    if (especificaciones) { 
      if (typeof especificaciones === 'string') {
        try {
          processedEspecificaciones = JSON.parse(especificaciones);
        } catch (e) {
          console.error("Error al parsear el JSON de especificaciones en createProducto:", e);
          return res.status(400).json({ message: "Formato de especificaciones inválido. Debe ser un objeto JSON o una cadena JSON válida." });
        }
      } else if (typeof especificaciones === 'object') {
        
        processedEspecificaciones = especificaciones;
      }

    } else {
     
        processedEspecificaciones = {};
    }

    let imagenes = [];
    if (req.files && req.files.length > 0) {
      const results = await uploadImages(req.files);
      imagenes = results.map(result => result.secure_url);
    }

    const producto = new Producto({
      ...productData, 
      category,
      subcategory,
      imagenes,
      especificaciones: processedEspecificaciones, 
      state: '1' 
    });

    // 8. Guardar el producto en la base de datos
    await producto.save();

   
    const productoPopulado = await Producto.findById(producto._id)
      .populate('category', 'name codigo') 
      .populate('subcategory', 'name');   

   
    res.status(201).json(productoPopulado);

  } catch (error) {
   
    console.error('Error en createProducto:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: 'Error de validación al crear producto', errors: messages });
    }
    res.status(500).json({
      message: 'Error interno del servidor al crear el producto.',
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
       
        { 'detalles.modelo': { $regex: search, $options: 'i' } }
      ];
    }

    if (Object.keys(filters).length > 0) {
      for (const key in filters) {
        if (filters[key]) {
        
          if (Array.isArray(filters[key])) {
            filtro[`detalles.${key}`] = { $in: filters[key] };
          } else {
            filtro[`detalles.${key}`] = filters[key];
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

    const { imagenesEliminadas, detalles, ...updatedFields } = req.body;
    const producto = await Producto.findById(req.params.id);

    if (!producto) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    if (imagenesEliminadas && imagenesEliminadas.length > 0) {
      const publicIds = imagenesEliminadas.map(url => {
        const parts = url.split('/');
        const filename = parts[parts.length - 1];
        return `productos/${filename.split('.')[0]}`;
      });
      await deleteImages(publicIds);
      producto.imagenes = producto.imagenes.filter(img => !imagenesEliminadas.includes(img));
    }

    if (req.files && req.files.length > 0) {
      const results = await uploadImages(req.files);
      const nuevasUrls = results.map(result => result.secure_url);
      producto.imagenes = [...producto.imagenes, ...nuevasUrls];
    }
    if (detalles) {
      let processedDetalles = {};
      if (typeof detalles === 'string') {
        try {
          processedDetalles = JSON.parse(detalles);
        } catch (e) {
          console.error("Error al parsear el JSON de detalles en updateProducto:", e);
          return res.status(400).json({ message: "Formato de detalles inválido. Debe ser un objeto JSON o una cadena JSON válida." });
        }
      } else if (typeof detalles === 'object') {
        processedDetalles = detalles;
      }
      producto.detalles = processedDetalles; 
    }

    // Actualizar otros campos
    Object.keys(updatedFields).forEach(key => {
   
      if (key !== 'imagenesEliminadas' && key !== 'imagenes' && key !== 'detalles') {
        producto[key] = updatedFields[key];
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
      
      [`detalles.${campo}`]: { $regex: `^${letra}`, $options: 'i' },
      state: '1'
    })
      .select('nombre precio imagenes detalles') 
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

   
    const camposFiltrables = ['marca', 'modelo']; 

   
    const filtros = {};

    for (const campo of camposFiltrables) {
      const letras = await Producto.aggregate([
   
        { $match: { category: categoria._id, state: '1', [`detalles.${campo}`]: { $exists: true, $ne: null, $ne: '' } } },
        { $project: {
          letra: { $substr: [{ $toUpper: `$detalles.${campo}` }, 0, 1] } 
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


export const getAvailableFilters = async (req, res) => {
  try {
      const { categoryId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(categoryId)) {
          return res.status(400).json({ message: 'ID de categoría inválido' });
      }

      const categoryObjectId = new mongoose.Types.ObjectId(categoryId);

   
      const categoria = await Categoria.findById(categoryObjectId);
      if (!categoria) {
          return res.status(404).json({ message: 'Categoría no encontrada' });
      }

      console.log(`[Backend] Fetched category code: "${categoria.codigo}"`);


      const schema = especificacionesCategorias[categoria.codigo]; 
      if (!schema) {
          console.log(`[Backend] No schema found for category code: ${categoria.codigo}`);
          
          const emptyFilters = {
              categoria: categoria.name,
              filters: {}
          };
        
          const defaultKeys = ['modelo', 'marca', 'sistemaOperativo', 'almacenamiento', 'ram', 'camaraPrincipal', 'bateria'];
          defaultKeys.forEach(key => emptyFilters.filters[key] = []);
          return res.status(200).json(emptyFilters);
      }


      const specKeys = Object.keys(schema.describe().keys); 

      console.log(`[Backend] Schema keys found: ${specKeys}`);

      const filters = {};

      for (const key of specKeys) {
          console.log(`[Backend] Aggregating for key: ${key}`);
          const uniqueValues = await Producto.aggregate([
              {
                  $match: {
                      category: categoryObjectId,
                      state: '1',
                      [`especificaciones.${key}`]: { $exists: true, $ne: null, $ne: '', $ne: {} } // <- Verificación adicional
                  }
              },
              {
                  $unwind: `$especificaciones.${key}` // Desglosa si el valor es un array
              },
              {
                  $group: {
                      _id: `$especificaciones.${key}`
                  }
              },
              {
                  $sort: { _id: 1 }
              }
          ]);

          const values = uniqueValues.map(item => ({
              label: item._id,
              value: item._id
          }));
          filters[key] = values;
          console.log(`[Backend] Unique values for ${key}:`, values); 
      }

      console.log(`[Backend] Final filters object:`, filters);

      res.status(200).json({
          categoria: categoria.name,
          filters: filters
      });

  } catch (error) {
      console.error('Error fetching available filters:', error);
      res.status(500).json({
          message: 'Error interno del servidor al obtener filtros disponibles.',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
  }
};

// Obtener rango de precios para una categoría
export const getPriceRange = async (req, res) => {
  try {
    const { categoryId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return res.status(400).json({ error: "ID de categoría inválido" });
    }

    const categoryObjectId = new mongoose.Types.ObjectId(categoryId);

    const result = await Producto.aggregate([
      { $match: { category: categoryObjectId, state: '1' } },
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
      min: Math.floor(result[0].min / 10000) * 10000,
      max: Math.ceil(result[0].max / 10000) * 10000
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