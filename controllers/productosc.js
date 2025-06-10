import mongoose from 'mongoose';
import Producto from '../models/productos.js';
import Categoria from '../models/categorias.js';
import Subcategoria from '../models/subcategorias.js';
import Marca from '../models/marcas.js';
import { uploadImages, deleteImages } from '../utils/teximage.js';
import { especificacionesCategorias } from '../utils/especificaciones.js';
import cron from 'node-cron';

// Crear nuevo producto
export const createProducto = async (req, res) => {
  try {
    const { category, subcategory, marca, especificaciones, ...productData } = req.body;
    
    // Validar IDs
    if (!mongoose.Types.ObjectId.isValid(category) || 
        !mongoose.Types.ObjectId.isValid(subcategory) ||
        !mongoose.Types.ObjectId.isValid(marca)) {
      return res.status(400).json({ message: 'IDs de categoría, subcategoría o marca inválidos.' });
    }
    
    // Verificar que la marca existe
    const marcaExiste = await Marca.findById(marca);
    if (!marcaExiste) {
      return res.status(400).json({ message: 'La marca especificada no existe.' });
    }

    // Verificar categoría y subcategoría
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

    // Procesar especificaciones
    let processedEspecificaciones = {};
    if (especificaciones) { 
      if (typeof especificaciones === 'string') {
        try {
          processedEspecificaciones = JSON.parse(especificaciones);
        } catch (e) {
          console.error("Error al parsear el JSON de especificaciones:", e);
          return res.status(400).json({ message: "Formato de especificaciones inválido." });
        }
      } else if (typeof especificaciones === 'object') {
        processedEspecificaciones = especificaciones;
      }
    }

    // Asegurar que el tipo de producto está definido
    if (!processedEspecificaciones.tipo) {
      processedEspecificaciones.tipo = categoria.name.toLowerCase(); // Ej: 'tablet', 'smartphone'
    }

    // Subir imágenes
    let imagenes = [];
    if (req.files && req.files.length > 0) {
      const results = await uploadImages(req.files);
      imagenes = results.map(result => result.secure_url);
    }

    // Crear el producto
    const producto = new Producto({
      ...productData, 
      category,
      subcategory,
      marca,
      imagenes,
      especificaciones: processedEspecificaciones,
      state: '1'
    });

    await producto.save();

    // Obtener producto poblado para la respuesta
    const productoPopulado = await Producto.findById(producto._id)
      .populate('category', 'name codigo')
      .populate('subcategory', 'name')
      .populate('marca', 'nombre logo');

    res.status(201).json(productoPopulado);

  } catch (error) {
    console.error('Error al crear producto:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: 'Error de validación', errors: messages });
    }
    
    res.status(500).json({
      message: 'Error interno del servidor',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Obtener productos con filtros
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

    // Agregar log para ver los parámetros recibidos
    console.log('Parámetros recibidos:', {
      category,
      subcategory,
      minPrice,
      maxPrice,
      search,
      sort,
      page,
      limit,
      format,
      filters
    });

    const filtro = { state: '1' };

    // Filtros básicos
    if (category) {
      filtro.category = category;
      
      // Obtener la categoría para validar las especificaciones
      const categoria = await Categoria.findById(category);
      if (!categoria) {
        return res.status(404).json({ error: "Categoría no encontrada" });
      }

      // Verificar si la categoría tiene especificaciones definidas (predefinidas o personalizadas)
      const especificacionesPredefinidas = especificacionesCategorias[categoria.codigo];
      const especificacionesPersonalizadas = categoria.especificaciones;

      if (!especificacionesPredefinidas && Object.keys(especificacionesPersonalizadas).length === 0) {
        return res.status(400).json({ 
          error: "Esta categoría no tiene especificaciones definidas",
          categoria: categoria.name
        });
      }

      // Si hay filtros de especificaciones
      if (Object.keys(filters).length > 0) {
        for (const key in filters) {
          // Extraer el nombre de la especificación del parámetro
          const specKey = key.replace('especificaciones.', '');
          if (filters[key]) {
            // Convertir el valor del filtro a string y aplicar búsqueda exacta
            const filterValue = String(filters[key]);
            // Usar la notación de punto para el filtro
            filtro[`especificaciones.${specKey}`] = filterValue;
          }
        }
      }
    }
    
    if (subcategory) filtro.subcategory = subcategory;
    
    // Filtro por precio
    if (minPrice || maxPrice) {
      filtro.precio = {};
      if (minPrice) filtro.precio.$gte = Number(minPrice);
      if (maxPrice) filtro.precio.$lte = Number(maxPrice);
    }

    // Búsqueda de texto
    if (search && search.trim().length > 0) {
      if (Producto.schema.indexes().some(idx => idx[0]['$**'] === 'text')) {
        filtro.$text = { $search: search };
      } else {
        filtro.$or = [
          { nombre: { $regex: search, $options: 'i' } },
          { descripcion: { $regex: search, $options: 'i' } },
          { 'especificaciones.tipo': { $regex: search, $options: 'i' } }
        ];
      }
    }

    // Opciones de ordenamiento
    const sortOptions = {
      'price_asc': { precio: 1 },
      'price_desc': { precio: -1 },
      'newest': { createdAt: -1 },
      'popular': { ventas: -1 },
      'az': { nombre: 1 },
      'za': { nombre: -1 },
      'relevance': { score: { $meta: 'textScore' } }
    };
    
    const sortOption = sortOptions[sort] || { createdAt: -1 };

    // Construir consulta
    let query = Producto.find(filtro)
      .populate('category', 'name codigo')
      .populate('subcategory', 'name')
      .populate('marca', 'nombre logo')
      .sort(sortOption);

    // Agregar log para depuración
    console.log('Filtro aplicado:', JSON.stringify(filtro, null, 2));

    // Paginación
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
    console.error('Error al obtener productos:', error);
    res.status(500).json({
      error: 'Error al obtener productos',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Obtener producto por ID
export const getProductoById = async (req, res) => {
  try {
    const producto = await Producto.findById(req.params.id)
      .populate('category', 'name')
      .populate('subcategory', 'name')
      .populate('marca', 'nombre logo');

    if (!producto) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    res.status(200).json(producto);
  } catch (error) {
    console.error('Error al obtener producto:', error);
    res.status(500).json({ error: error.message });
  }
};

// Actualizar producto
export const updateProducto = async (req, res) => {
  try {
    const { imagenesEliminadas, detalles, ...updatedFields } = req.body;
    const producto = await Producto.findById(req.params.id);

    if (!producto) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    // Manejo de imágenes
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

    // Actualizar detalles
    if (detalles) {
      let processedDetalles = {};
      if (typeof detalles === 'string') {
        try {
          processedDetalles = JSON.parse(detalles);
        } catch (e) {
          console.error("Error al parsear detalles:", e);
          return res.status(400).json({ message: "Formato de detalles inválido." });
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
    console.error('Error al actualizar producto:', error);
    res.status(500).json({ error: error.message });
  }
};

// Cambiar estado de producto
export const toggleProductoState = async (req, res) => {
  try {
    const producto = await Producto.findById(req.params.id);
    if (!producto) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    
    producto.state = producto.state === '1' ? '0' : '1';
    await producto.save();
    res.status(200).json(producto);
  } catch (error) {
    console.error('Error al cambiar estado:', error);
    res.status(500).json({ error: error.message });
  }
};

// Obtener filtros alfabéticos
export const getFiltrosAlfabeticos = async (req, res) => {
  try {
    const { category } = req.params;

    const categoria = await Categoria.findById(category);
    if (!categoria) {
      return res.status(404).json({ error: 'Categoría no encontrada' });
    }

    const camposFiltrables = ['marca', 'modelo', 'tipo']; 

    const filtros = {};

    for (const campo of camposFiltrables) {
      const letras = await Producto.aggregate([
        { $match: { 
          category: categoria._id, 
          state: '1',
          [`especificaciones.${campo}`]: { $exists: true, $ne: null, $ne: '' }
        }},
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
    console.error('Error al obtener filtros alfabéticos:', error);
    res.status(500).json({
      error: 'Error al obtener filtros',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Obtener productos por letra
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
    console.error('Error al filtrar por letra:', error);
    res.status(500).json({
      error: 'Error al filtrar productos',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Obtener filtros disponibles
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

    // Primero intentar obtener especificaciones predefinidas
    let schema = especificacionesCategorias[categoria.codigo];
    let specKeys = [];

    if (schema) {
      // Si hay especificaciones predefinidas, usarlas
      specKeys = ['tipo', ...Object.keys(schema.describe?.().keys || {})];
    } else if (categoria.especificaciones && Object.keys(categoria.especificaciones).length > 0) {
      // Si no hay predefinidas pero hay personalizadas, usarlas
      specKeys = Object.keys(categoria.especificaciones);
    } else {
      // Si no hay especificaciones definidas, devolver un objeto vacío
      return res.status(200).json({
        categoria: categoria.name,
        filters: {}
      });
    }

    const filters = {};

    for (const key of specKeys) {
      const uniqueValues = await Producto.aggregate([
        {
          $match: {
            category: categoryObjectId,
            state: '1',
            [`especificaciones.${key}`]: { $exists: true, $ne: null, $ne: '' }
          }
        },
        {
          $unwind: `$especificaciones.${key}`
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
    }

    res.status(200).json({
      categoria: categoria.name,
      filters: filters
    });

  } catch (error) {
    console.error('Error al obtener filtros:', error);
    res.status(500).json({
      message: 'Error interno del servidor',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Obtener rango de precios
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
    console.error('Error al obtener rango de precios:', error);
    res.status(500).json({
      error: "Error al obtener precios",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Obtener sugerencias de búsqueda
export const getSearchSuggestions = async (req, res) => {
  try {
    const { query, category, limit = 5 } = req.query;

    if (!query || query.length < 2) {
      return res.status(200).json({
        products: [],
        categories: []
      });
    }

    const productMatch = {
      $or: [
        { nombre: { $regex: query, $options: 'i' } },
        { descripcion: { $regex: query, $options: 'i' } },
        { 'especificaciones.tipo': { $regex: query, $options: 'i' } }
      ],
      state: '1'
    };

    if (category && category !== 'all') {
      productMatch.category = category;
    }

    const products = await Producto.find(productMatch)
      .select('nombre category especificaciones.tipo')
      .limit(Number(limit))
      .populate('category', 'name codigo');

    const categories = await Categoria.find({
      name: { $regex: query, $options: 'i' }
    })
      .select('name codigo')
      .limit(Number(limit));

    res.status(200).json({
      products,
      categories
    });
  } catch (error) {
    console.error('Error al obtener sugerencias:', error);
    res.status(500).json({
      error: 'Error al obtener sugerencias',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Buscar productos
export const searchProducts = async (req, res) => {
  try {
    const { q: query, category } = req.query;

    if (!query) {
      return res.status(400).json({ error: 'Parámetro de búsqueda requerido' });
    }

    const match = {
      state: '1'
    };

    // Búsqueda por tipo de producto si es muy específico (ej: "tablets")
    const searchTerm = query.toLowerCase().trim();
    if (['tablet', 'tablets'].includes(searchTerm)) {
      match['especificaciones.tipo'] = 'tablet';
    } else {
      // Búsqueda general
      if (Producto.schema.indexes().some(idx => idx[0]['$**'] === 'text')) {
        match.$text = { $search: searchTerm };
      } else {
        match.$or = [
          { nombre: { $regex: searchTerm, $options: 'i' } },
          { descripcion: { $regex: searchTerm, $options: 'i' } },
          { 'especificaciones.tipo': { $regex: searchTerm, $options: 'i' } }
        ];
      }
    }

    if (category && category !== 'all') {
      match.category = category;
    }

    const products = await Producto.find(match)
      .populate('category', 'name codigo')
      .populate('subcategory', 'name')
      .populate('marca', 'nombre logo')
      .sort({ score: { $meta: 'textScore' } })
      .limit(100);

    res.status(200).json(products);
  } catch (error) {
    console.error('Error al buscar productos:', error);
    res.status(500).json({
      error: 'Error al buscar productos',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Establecer oferta para un producto
export const setProductoOferta = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      enOferta, 
      porcentajeDescuento, 
      fechaInicioOferta, 
      fechaFinOferta 
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'ID de producto inválido' });
    }

    const producto = await Producto.findById(id);
    if (!producto) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    // Validar porcentaje de descuento
    if (porcentajeDescuento < 0 || porcentajeDescuento > 100) {
      return res.status(400).json({ error: 'El porcentaje de descuento debe estar entre 0 y 100' });
    }

    // Actualizar campos de oferta
    producto.enOferta = enOferta || false;
    producto.porcentajeDescuento = porcentajeDescuento || 0;
    producto.fechaInicioOferta = fechaInicioOferta ? new Date(fechaInicioOferta) : null;
    producto.fechaFinOferta = fechaFinOferta ? new Date(fechaFinOferta) : null;
    
    // Calcular precio de oferta
    producto.precioOferta = producto.precio * (1 - producto.porcentajeDescuento / 100);

    await producto.save();

    res.status(200).json(producto);
  } catch (error) {
    console.error('Error al establecer oferta:', error);
    res.status(500).json({ error: error.message });
  }
};

// Obtener productos en oferta
export const getProductosEnOferta = async (req, res) => {
  try {
    const { limit = 10, page = 1 } = req.query;
    const skip = (page - 1) * limit;
    
    const now = new Date();
    
    // Buscar productos con oferta activa
    const productos = await Producto.find({
      enOferta: true,
      state: '1',
      $or: [
        { fechaInicioOferta: { $exists: false } },
        { fechaInicioOferta: null },
        { fechaInicioOferta: { $lte: now } }
      ],
      $or: [
        { fechaFinOferta: { $exists: false } },
        { fechaFinOferta: null },
        { fechaFinOferta: { $gte: now } }
      ]
    })
      .populate('category', 'name codigo')
      .populate('subcategory', 'name')
      .populate('marca', 'nombre logo')
      .sort({ porcentajeDescuento: -1 })
      .skip(skip)
      .limit(Number(limit));
    
    const total = await Producto.countDocuments({
      enOferta: true,
      state: '1',
      $or: [
        { fechaInicioOferta: { $exists: false } },
        { fechaInicioOferta: null },
        { fechaInicioOferta: { $lte: now } }
      ],
      $or: [
        { fechaFinOferta: { $exists: false } },
        { fechaFinOferta: null },
        { fechaFinOferta: { $gte: now } }
      ]
    });
    
    const totalPages = Math.ceil(total / limit);
    
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
    console.error('Error al obtener productos en oferta:', error);
    res.status(500).json({ error: error.message });
  }
};

// Generar ofertas automáticas basadas en stock y tiempo
export const generarOfertasAutomaticas = async (req, res) => {
  try {
    const { 
      stockMinimo = 1, 
      porcentajeDescuento = 15,
      duracionOfertaDias = 7
    } = req.body;
    
    // Validar parámetros
    if (porcentajeDescuento <= 0 || porcentajeDescuento > 100) {
      return res.status(400).json({
        error: 'El porcentaje de descuento debe estar entre 1 y 100',
        detalles: { porcentajeDescuento }
      });
    }

    // Buscar todos los productos activos
    const todosLosProductos = await Producto.find({ 
      state: '1'
    });
    
    // Agrupar productos por marca para análisis
    const productosPorMarca = {};
    const productosConMarcaInvalida = [];
    
    for (const producto of todosLosProductos) {
      if (typeof producto.marca === 'string') {
        // Si la marca es un string, es inválida
        productosConMarcaInvalida.push({
          id: producto._id,
          nombre: producto.nombre,
          marcaActual: producto.marca
        });
      } else {
        // Agrupar por ID de marca
        const marcaId = producto.marca ? producto.marca.toString() : 'sin_marca';
        if (!productosPorMarca[marcaId]) {
          productosPorMarca[marcaId] = [];
        }
        productosPorMarca[marcaId].push(producto);
      }
    }

    // Si hay productos con marcas inválidas, reportar y no continuar
    if (productosConMarcaInvalida.length > 0) {
      return res.status(400).json({
        error: 'Hay productos con marcas inválidas',
        detalles: 'Algunos productos tienen marcas como texto en lugar de referencias válidas',
        productosConMarcaInvalida,
        instrucciones: 'Por favor, actualiza estos productos con las marcas correctas usando el endpoint de actualización de productos'
      });
    }

    const productosNoCalifican = [];
    const productosActualizados = [];
    const errores = [];
    
    // Procesar solo productos con marcas válidas
    for (const producto of todosLosProductos) {
      try {
        const razonesNoCalifica = [];
        
        if (producto.enOferta) {
          razonesNoCalifica.push('Ya está en oferta');
        }
        
        if (producto.stock < stockMinimo) {
          razonesNoCalifica.push(`Stock insuficiente (tiene ${producto.stock}, necesita ${stockMinimo})`);
        }
        
        if (razonesNoCalifica.length > 0) {
          productosNoCalifican.push({
            id: producto._id,
            nombre: producto.nombre,
            razones: razonesNoCalifica
          });
          continue;
        }
        
        // Si llegamos aquí, el producto califica para oferta
        producto.enOferta = true;
        producto.porcentajeDescuento = porcentajeDescuento;
        producto.fechaInicioOferta = new Date();
        producto.fechaFinOferta = new Date(Date.now() + (duracionOfertaDias * 24 * 60 * 60 * 1000));
        
        await producto.save();
        
        productosActualizados.push({
          id: producto._id,
          nombre: producto.nombre,
          precioOriginal: producto.precio,
          precioOferta: producto.precioOferta,
          porcentajeDescuento,
          stock: producto.stock
        });
      } catch (error) {
        errores.push({
          productoId: producto._id,
          nombre: producto.nombre,
          error: error.message
        });
      }
    }
    
    res.status(200).json({
      mensaje: `Se generaron ofertas para ${productosActualizados.length} productos`,
      productosActualizados,
      detalles: {
        totalProductos: todosLosProductos.length,
        productosConOferta: productosActualizados.length,
        productosNoCalifican,
        errores,
        criteriosUsados: {
          stockMinimo,
          porcentajeDescuento,
          duracionOfertaDias
        }
      }
    });
  } catch (error) {
    console.error('Error al generar ofertas automáticas:', error);
    res.status(500).json({ 
      error: error.message,
      detalles: 'Hubo un error al procesar las ofertas automáticas. Verifica que todos los productos tengan marcas válidas.'
    });
  }
};

// Configurar tarea programada para ejecutarse cada día a la medianoche
export const configurarOfertasAutomaticas = () => {
  cron.schedule('0 0 * * *', async () => {
    try {
      const stockMinimo = 20;
      const diasEnInventario = 30;
      const porcentajeDescuento = 15;
      const duracionOfertaDias = 7;
      
      const fechaLimite = new Date();
      fechaLimite.setDate(fechaLimite.getDate() - diasEnInventario);
      
      const productosParaOferta = await Producto.find({
        state: '1',
        enOferta: false,
        $or: [
          { stock: { $gte: stockMinimo } },
          { createdAt: { $lte: fechaLimite } }
        ]
      });
      
      const fechaInicio = new Date();
      const fechaFin = new Date();
      fechaFin.setDate(fechaFin.getDate() + duracionOfertaDias);
      
      for (const producto of productosParaOferta) {
        producto.enOferta = true;
        producto.porcentajeDescuento = porcentajeDescuento;
        producto.fechaInicioOferta = fechaInicio;
        producto.fechaFinOferta = fechaFin;
        producto.precioOferta = producto.precio * (1 - porcentajeDescuento / 100);
        
        await producto.save();
      }
      
      console.log(`Ofertas automáticas generadas para ${productosParaOferta.length} productos`);
    } catch (error) {
      console.error('Error al generar ofertas automáticas:', error);
    }
  });
};

// Eliminar ofertas de productos
export const eliminarOfertas = async (req, res) => {
  try {
    const { productos } = req.body;
    
    let productosActualizados = [];
    let errores = [];

    if (productos && productos.length > 0) {
      // Eliminar ofertas solo de los productos especificados
      for (const productoId of productos) {
        try {
          const producto = await Producto.findById(productoId);
          if (!producto) {
            errores.push({ id: productoId, error: 'Producto no encontrado' });
            continue;
          }

          producto.enOferta = false;
          producto.porcentajeDescuento = 0;
          producto.precioOferta = producto.precio;
          producto.fechaInicioOferta = null;
          producto.fechaFinOferta = null;

          await producto.save();
          productosActualizados.push({
            id: producto._id,
            nombre: producto.nombre
          });
        } catch (error) {
          errores.push({ id: productoId, error: error.message });
        }
      }
    } else {
      // Si no se especifican productos, eliminar todas las ofertas
      const productosEnOferta = await Producto.find({ enOferta: true });
      
      for (const producto of productosEnOferta) {
        try {
          producto.enOferta = false;
          producto.porcentajeDescuento = 0;
          producto.precioOferta = producto.precio;
          producto.fechaInicioOferta = null;
          producto.fechaFinOferta = null;

          await producto.save();
          productosActualizados.push({
            id: producto._id,
            nombre: producto.nombre
          });
        } catch (error) {
          errores.push({ id: producto._id, error: error.message });
        }
      }
    }

    res.status(200).json({
      mensaje: `Se eliminaron las ofertas de ${productosActualizados.length} productos`,
      productosActualizados,
      errores
    });
  } catch (error) {
    console.error('Error al eliminar ofertas:', error);
    res.status(500).json({ 
      error: 'Error al eliminar ofertas',
      detalles: error.message 
    });
  }
};

// Verificar stock de un producto
export const checkProductStock = async (req, res) => {
    try {
        const { productId } = req.params;
        const producto = await Producto.findById(productId);
        
        if (!producto) {
            return res.status(404).json({ message: "Producto no encontrado" });
        }

        res.status(200).json({
            nombre: producto.nombre,
            stock: producto.stock,
            ultimaActualizacion: producto.updatedAt
        });
    } catch (error) {
        console.error('Error verificando stock:', error);
        res.status(500).json({ message: error.message });
    }
};

export default {
  createProducto,
  getProductos,
  getProductoById,
  updateProducto,
  toggleProductoState,
  getFiltrosAlfabeticos,
  getProductosPorLetra,
  getAvailableFilters,
  getPriceRange,
  getSearchSuggestions,
  searchProducts,
  setProductoOferta,
  getProductosEnOferta,
  generarOfertasAutomaticas,
  configurarOfertasAutomaticas,
  eliminarOfertas,
  checkProductStock
};


