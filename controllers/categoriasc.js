import mongoose from 'mongoose';
import Categoria from '../models/categorias.js';
import { especificacionesCategorias } from '../utils/especificaciones.js';

// Controlador para crear categoría
export const createCategoria = async (req, res) => {
  const { codigo, name, description, img } = req.body;

  const categoriasPermitidas = Object.keys(especificacionesCategorias);
  
  if (!categoriasPermitidas.includes(codigo)) {
    return res.status(400).json({ 
      error: "Código de categoría no válido",
      categoriasPermitidas 
    });
  }

  try {
    const existeCategoria = await Categoria.findOne({ codigo });
    if (existeCategoria) {
      return res.status(400).json({ error: "Esta categoría ya existe" });
    }

    const categoria = new Categoria({ codigo, name, description, img });
    await categoria.save();
    res.status(201).json(categoria);

  } catch (error) {
    res.status(500).json({ 
      error: "Error al crear categoría",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Obtener todas las categorías
export const getCategorias = async (req, res) => {
  try {
    const categorias = await Categoria.find({ state: '1' }).sort({ name: 1 });
    res.status(200).json(categorias);
  } catch (error) {
    res.status(500).json({ 
      error: "Error al listar categorías",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Obtener categoría por ID
export const getCategoriaById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validar que el ID tenga un formato válido
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "ID de categoría inválido" });
    }

    const categoria = await Categoria.findById(id);
    if (!categoria) {
      return res.status(404).json({ message: 'Categoría no encontrada' });
    }
    res.json(categoria);
  } catch (error) {
    res.status(500).json({ 
      error: "Error al obtener categoría",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Obtener especificaciones de categoría
export const getEspecificacionesByCategoria = async (req, res) => {
  const { codigo } = req.params;

  if (!especificacionesCategorias[codigo]) {
    return res.status(404).json({ error: "Categoría no encontrada" });
  }

  // Extraer información de los campos desde la definición de Joi
  const camposJoi = especificacionesCategorias[codigo].describe().keys;
  const campos = [];
  
  for (const [key, schema] of Object.entries(camposJoi)) {
    const campo = {
      nombre: key,
      requerido: schema.flags?.presence === 'required',
      tipo: schema.type
    };
    
    // Si tiene valores válidos definidos, incluirlos
    if (schema.valids && schema.valids.length > 0) {
      campo.valores = schema.valids;
    }
    
    // Si tiene un patrón definido, incluirlo
    if (schema.rules) {
      const patternRule = schema.rules.find(rule => rule.name === 'pattern');
      if (patternRule) {
        campo.patron = patternRule.args.regex.toString();
      }
    }
    
    campos.push(campo);
  }

  res.status(200).json({
    categoria: codigo,
    campos: campos
  });
};

// Actualizar categoría (solo metadata, no especificaciones)
export const updateCategoria = async (req, res) => {
  const { id } = req.params;
  const { name, description, img } = req.body;

  try {
    // Validar que el ID tenga un formato válido
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "ID de categoría inválido" });
    }

    const categoria = await Categoria.findByIdAndUpdate(
      id,
      { name, description, img },
      { new: true }
    );

    if (!categoria) {
      return res.status(404).json({ error: "Categoría no encontrada" });
    }

    res.status(200).json(categoria);
  } catch (error) {
    res.status(500).json({ 
      error: "Error al actualizar categoría",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Cambiar estado de categoría
export const toggleCategoriaState = async (req, res) => {
  const { id } = req.params;

  try {
    // Validar que el ID tenga un formato válido
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "ID de categoría inválido" });
    }

    const categoria = await Categoria.findById(id);
    if (!categoria) {
      return res.status(404).json({ error: "Categoría no encontrada" });
    }

    categoria.state = categoria.state === '1' ? '0' : '1';
    await categoria.save();

    res.status(200).json({
      message: `Categoría ${categoria.state === '1' ? 'activada' : 'desactivada'}`,
      categoria
    });
  } catch (error) {
    res.status(500).json({ 
      error: "Error al cambiar estado",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Obtener filtros disponibles para una categoría por ID
export const getFiltersByCategoriaId = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validar que el ID tenga un formato válido
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "ID de categoría inválido" });
    }

    // Buscar la categoría por ID
    const categoria = await Categoria.findById(id);
    if (!categoria) {
      return res.status(404).json({ error: "Categoría no encontrada" });
    }

    // Obtener el código de la categoría
    const codigoCategoria = categoria.codigo;
    
    // Verificar si tenemos especificaciones predefinidas para esta categoría
    if (!especificacionesCategorias[codigoCategoria]) {
      return res.status(200).json({
        categoria: categoria.name,
        filters: {},
        message: `No hay especificaciones predefinidas para la categoría ${categoria.name}`
      });
    }

    // Extraer filtros de las especificaciones predefinidas
    const especificacionesPredef = especificacionesCategorias[codigoCategoria].describe().keys;
    const filtros = {};
    
    for (const key in especificacionesPredef) {
      // Verificar si el campo tiene valores válidos predefinidos
      if (especificacionesPredef[key].valids && especificacionesPredef[key].valids.length > 0) {
        filtros[key] = especificacionesPredef[key].valids.map(value => ({
          label: value,
          value: value
        }));
      } else {
        // Para campos que no tienen valores predefinidos, creamos un filtro vacío
        filtros[key] = [];
      }
    }

    // Ordenar los valores de cada filtro alfabéticamente
    for (const key in filtros) {
      filtros[key].sort((a, b) => a.label.localeCompare(b.label));
    }

    res.status(200).json({
      categoria: categoria.name,
      filters: filtros
    });

  } catch (error) {
    console.error('Error en getFiltersByCategoriaId:', error);
    res.status(500).json({ 
      error: "Error al obtener filtros de categoría",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export default {
  createCategoria,
  getCategorias,
  getCategoriaById,
  getEspecificacionesByCategoria,
  updateCategoria,
  toggleCategoriaState,
  getFiltersByCategoriaId
};