import mongoose from 'mongoose';
import Marca from '../models/marcas.js';

// Crear marca
export const createMarca = async (req, res) => {
  try {
    const { nombre, logo } = req.body;
    
    const existeMarca = await Marca.findOne({ nombre });
    if (existeMarca) {
      return res.status(400).json({ error: "Esta marca ya existe" });
    }

    const marca = new Marca({ nombre, logo });
    await marca.save();
    res.status(201).json(marca);
  } catch (error) {
    res.status(500).json({ 
      error: "Error al crear marca",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Obtener todas las marcas
export const getMarcas = async (req, res) => {
  try {
    const marcas = await Marca.find({ state: '1' });
    res.status(200).json(marcas);
  } catch (error) {
    res.status(500).json({ 
      error: "Error al obtener marcas",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Obtener marca por ID
export const getMarcaById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "ID de marca inválido" });
    }
    
    const marca = await Marca.findById(id);
    if (!marca) {
      return res.status(404).json({ error: "Marca no encontrada" });
    }
    
    res.status(200).json(marca);
  } catch (error) {
    res.status(500).json({ 
      error: "Error al obtener marca",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Obtener marca por slug
export const getMarcaBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    
    if (!slug) {
      return res.status(400).json({ 
        error: 'Identificador de marca inválido',
        details: 'El identificador no puede estar vacío'
      });
    }

    console.log('Buscando marca con identificador:', slug); // Debug log

    let marca;
    
    // Si parece un ID de MongoDB (24 caracteres hexadecimales)
    if (/^[0-9a-fA-F]{24}$/.test(slug)) {
      marca = await Marca.findById(slug);
    } else {
      // Si no es un ID, buscar por slug
      marca = await Marca.findOne({ slug: slug.toLowerCase() });
    }

    if (!marca) {
      console.log('Marca no encontrada con identificador:', slug); // Debug log
      return res.status(404).json({ 
        error: 'Marca no encontrada',
        details: `No se encontró ninguna marca con el identificador: ${slug}`,
        searchedIdentifier: slug
      });
    }

    console.log('Marca encontrada:', marca._id); // Debug log
    res.status(200).json(marca);
  } catch (error) {
    console.error('Error al obtener marca:', error);
    res.status(500).json({ 
      error: 'Error al obtener la marca',
      details: error.message
    });
  }
};

// Actualizar marca
export const updateMarca = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, logo } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "ID de marca inválido" });
    }
    
    const marca = await Marca.findByIdAndUpdate(
      id,
      { nombre, logo },
      { new: true }
    );
    
    if (!marca) {
      return res.status(404).json({ error: "Marca no encontrada" });
    }
    
    res.status(200).json(marca);
  } catch (error) {
    res.status(500).json({ 
      error: "Error al actualizar marca",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Cambiar estado de marca (activar/desactivar)
export const toggleMarcaState = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "ID de marca inválido" });
    }
    
    const marca = await Marca.findById(id);
    if (!marca) {
      return res.status(404).json({ error: "Marca no encontrada" });
    }
    
    marca.state = marca.state === '1' ? '0' : '1';
    await marca.save();
    
    res.status(200).json(marca);
  } catch (error) {
    res.status(500).json({ 
      error: "Error al cambiar estado de marca",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Actualizar slugs de marcas existentes
export const actualizarSlugs = async (req, res) => {
  try {
    const marcas = await Marca.find({});
    const resultados = {
      actualizados: 0,
      errores: [],
      totalMarcas: marcas.length
    };

    for (const marca of marcas) {
      try {
        // Generar el slug manualmente
        const nombreStr = String(marca.nombre).trim();
        let baseSlug = nombreStr
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');

        if (!baseSlug) {
          baseSlug = 'marca-' + Date.now();
        }

        // Actualizar el slug directamente
        marca.slug = baseSlug;
        await marca.save();
        
        resultados.actualizados++;
      } catch (error) {
        resultados.errores.push({
          marcaId: marca._id,
          nombre: marca.nombre,
          error: error.message
        });
      }
    }

    res.status(200).json({
      message: "Proceso de actualización de slugs completado",
      ...resultados,
      detalles: {
        marcasActualizadas: resultados.actualizados,
        marcasConError: resultados.errores.length,
        totalProcesadas: marcas.length
      }
    });
  } catch (error) {
    res.status(500).json({
      error: "Error al actualizar slugs",
      details: error.message
    });
  }
};

export default {
  createMarca,
  getMarcas,
  getMarcaById,
  getMarcaBySlug,
  updateMarca,
  toggleMarcaState,
  actualizarSlugs
};