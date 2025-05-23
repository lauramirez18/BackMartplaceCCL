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
  const schemaCategoria = especificacionesCategorias[codigo];

  if (!schemaCategoria) {
    return res.status(404).json({ error: "Categoría no encontrada o sin especificaciones definidas" });
  }

  try {
    const descripcionCompleta = schemaCategoria.describe();
    const camposDetallados = [];

    for (const [key, fieldDesc] of Object.entries(descripcionCompleta.keys || {})) {
      const detalleCampo = {
        key: key,
        label: key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()).trim(), // Helper for label
        required: fieldDesc.flags?.presence === 'required',
        type: fieldDesc.type, // 'string', 'number', 'boolean', 'array'
        options: [],
        rules: {} // For min, max, pattern
      };

      // Check for .valid() options for selects/multiselects
      if (fieldDesc.allow && Array.isArray(fieldDesc.allow)) {
        const validValues = fieldDesc.allow.filter(v => v !== null && v !== undefined);
        if (validValues.length > 0) {
          // Differentiate single select from boolean
          if (fieldDesc.type === 'string' || fieldDesc.type === 'number') { // Could be other primitive types too
             detalleCampo.uiType = 'select'; // Custom hint for UI
             detalleCampo.options = validValues.map(val => ({ label: String(val), value: val }));
          }
        }
      }
      
      if (fieldDesc.type === 'boolean') {
        detalleCampo.uiType = 'boolean';
      } else if (fieldDesc.type === 'number') {
        detalleCampo.uiType = 'number';
        const minRule = fieldDesc.rules?.find(r => r.name === 'min');
        if (minRule) detalleCampo.rules.min = minRule.args.limit;
        const maxRule = fieldDesc.rules?.find(r => r.name === 'max');
        if (maxRule) detalleCampo.rules.max = maxRule.args.limit;
      } else if (fieldDesc.type === 'array' && fieldDesc.items && fieldDesc.items.length > 0) {
        const itemSchema = fieldDesc.items[0];
        if (itemSchema.allow && Array.isArray(itemSchema.allow)) {
           const itemValidValues = itemSchema.allow.filter(v => v !== null && v !== undefined);
           if (itemValidValues.length > 0) {
             detalleCampo.uiType = 'multiselect';
             detalleCampo.options = itemValidValues.map(val => ({ label: String(val), value: val }));
           }
        } else {
          detalleCampo.uiType = 'array_generic'; // e.g., render as textarea for JSON array
        }
      } else if (fieldDesc.type === 'string') {
         // Default uiType for string is 'text', unless already set to 'select'
         if(!detalleCampo.uiType) detalleCampo.uiType = 'text';
         const patternRule = fieldDesc.rules?.find(r => r.name === 'pattern');
         if (patternRule && patternRule.args?.regex) {
           detalleCampo.rules.pattern = patternRule.args.regex.toString(); // Send regex as string
         }
      }
      if(!detalleCampo.uiType) detalleCampo.uiType = 'text'; // Default

      camposDetallados.push(detalleCampo);
    }

    res.status(200).json({
      categoria: codigo,
      especificaciones: camposDetallados
    });

  } catch (error) {
    console.error(`Error describiendo especificaciones para ${codigo}:`, error);
    res.status(500).json({ error: "Error al procesar especificaciones de la categoría" });
  }
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