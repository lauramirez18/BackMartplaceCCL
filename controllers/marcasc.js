import mongoose from 'mongoose';
import Marca from '../models/marcas.js';
import Producto from '../models/productos.js';

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

    // Obtener productos relacionados a la marca
    const productos = await Producto.find({ 
      marca: id,
      state: '1'
    })
    .populate('category', 'name codigo')
    .populate('subcategory', 'name')
    .populate('marca', 'nombre logo');
    
    res.status(200).json({
      marca,
      productos
    });
  } catch (error) {
    res.status(500).json({ 
      error: "Error al obtener marca y sus productos",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
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

export default {
  createMarca,
  getMarcas,
  getMarcaById,
  updateMarca,
  toggleMarcaState
};