import mongoose from 'mongoose';
import Categoria from '../models/categorias.js';
import Subcategoria from '../models/subcategorias.js';
import { especificacionesCategorias } from '../utils/especificaciones.js';
import Joi from 'joi';

// Controlador para crear categoría
export const createCategoria = async (req, res) => {
  try {
    const { codigo, name, description, img, especificaciones, subcategorias } = req.body;

    // Validar que no exista una categoría con el mismo código
    const categoriaExistente = await Categoria.findOne({ codigo });
    if (categoriaExistente) {
      return res.status(400).json({
        success: false,
        error: 'Ya existe una categoría con este código'
      });
    }

    // Validar especificaciones si se proporcionan
    if (especificaciones && Object.keys(especificaciones).length > 0) {
      const schema = {};
      Object.entries(especificaciones).forEach(([key, spec]) => {
        let baseType;
        switch (spec.tipo) {
          case 'string':
            baseType = Joi.string();
            break;
          case 'number':
            baseType = Joi.number();
            break;
          case 'boolean':
            baseType = Joi.boolean();
            break;
          case 'array':
            baseType = Joi.array();
            break;
          default:
            baseType = Joi.string();
        }

        // Hacer todos los campos opcionales para la validación de estructura
        baseType = baseType.optional();

        if (spec.min !== undefined) baseType = baseType.min(spec.min);
        if (spec.max !== undefined) baseType = baseType.max(spec.max);
        if (spec.pattern) baseType = baseType.pattern(new RegExp(spec.pattern));

        schema[key] = baseType;
      });

      // Validar la estructura con un objeto vacío
      const validationSchema = Joi.object(schema).unknown(true);
      const { error } = validationSchema.validate({}, { abortEarly: false });
      if (error) {
        return res.status(400).json({
          success: false,
          error: 'Especificaciones inválidas',
          details: error.details.map(detail => detail.message).join(', ')
        });
      }
    }

    // Crear la categoría
    const categoria = new Categoria({
      codigo,
      name,
      description,
      img,
      especificaciones: especificaciones || {},
      esPredefinida: false
    });

    await categoria.save();

    // Crear subcategorías si se proporcionan
    if (subcategorias && Array.isArray(subcategorias) && subcategorias.length > 0) {
      const subcategoriasToCreate = subcategorias.map(sub => ({
        codigo: `${codigo}_${sub.codigo}`,
        name: sub.name,
        categoriaPadre: codigo
      }));

      try {
        await Subcategoria.insertMany(subcategoriasToCreate);
      } catch (error) {
        // Si hay error al crear subcategorías, eliminar la categoría creada
        await Categoria.findByIdAndDelete(categoria._id);
        throw new Error('Error al crear subcategorías: ' + error.message);
      }
    }

    // Obtener las subcategorías creadas
    const subcategoriasCreadas = await Subcategoria.find({ categoriaPadre: codigo });

    res.status(201).json({
      success: true,
      message: 'Categoría y subcategorías creadas exitosamente',
      data: {
        categoria,
        subcategorias: subcategoriasCreadas
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error al crear categoría',
      details: error.message
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

  try {
    // Primero buscar en las categorías predefinidas
    let schemaCategoria = especificacionesCategorias[codigo];
    let camposDetallados = [];
    
    // Si no está en las predefinidas, buscar en la base de datos
    if (!schemaCategoria) {
      const categoria = await Categoria.findOne({ codigo });
      if (!categoria) {
        return res.status(404).json({ error: "Categoría no encontrada" });
      }
      
      // Si la categoría tiene especificaciones personalizadas
      if (categoria.especificaciones && Object.keys(categoria.especificaciones).length > 0) {
        camposDetallados = Object.entries(categoria.especificaciones).map(([key, spec]) => ({
          key,
          label: key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()).trim(),
          required: spec.required || false,
          type: spec.tipo || 'string',
          uiType: getUiType(spec),
          options: spec.opciones || [],
          rules: {
            min: spec.min,
            max: spec.max
          }
        }));

        return res.status(200).json({
          categoria: codigo,
          especificaciones: camposDetallados
        });
      }
      
      return res.status(200).json({
        categoria: codigo,
        especificaciones: []
      });
    }

    // Si es una categoría predefinida, usar el schema existente
    const descripcionCompleta = schemaCategoria.describe();

    for (const [key, fieldDesc] of Object.entries(descripcionCompleta.keys || {})) {
      const detalleCampo = {
        key: key,
        label: key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()).trim(),
        required: fieldDesc.flags?.presence === 'required',
        type: fieldDesc.type,
        options: [],
        rules: {}
      };

      if (fieldDesc.allow && Array.isArray(fieldDesc.allow)) {
        const validValues = fieldDesc.allow.filter(v => v !== null && v !== undefined);
        if (validValues.length > 0) {
          detalleCampo.uiType = 'select';
          detalleCampo.options = validValues.map(val => ({ label: String(val), value: val }));
        }
      }
      
      detalleCampo.uiType = getUiType(fieldDesc);
      
      if (fieldDesc.type === 'number') {
        const minRule = fieldDesc.rules?.find(r => r.name === 'min');
        if (minRule) detalleCampo.rules.min = minRule.args.limit;
        const maxRule = fieldDesc.rules?.find(r => r.name === 'max');
        if (maxRule) detalleCampo.rules.max = maxRule.args.limit;
      }

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

// Función auxiliar para determinar el tipo de UI
const getUiType = (spec) => {
  if (spec.tipo === 'boolean') return 'boolean';
  if (spec.tipo === 'number') return 'number';
  if (spec.tipo === 'array') return 'multiselect';
  if (spec.opciones && spec.opciones.length > 0) return 'select';
  return 'text';
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