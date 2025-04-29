import Categorias from "../models/categorias.js";

// Crear una categoría
export const createCategoria = async (req, res) => {
    try {
        const { nombre, descripcion } = req.body;

     
        if (!nombre || !descripcion) {
            return res.status(400).json({ message: "Nombre y descripción son obligatorios" });
        }

        const categoria = new Categorias({ nombre, descripcion });
        await categoria.save();

        res.status(201).json(categoria);
    } catch (error) {
        console.error("Error al crear la categoría:", error);
        res.status(500).json({ message: "Error al crear la categoría", error: error.message });
    }
};

// Listar todas las categorías
export const getCategorias = async (req, res) => {
    try {
        const categorias = await Categorias.find();
        res.status(200).json(categorias);
    } catch (error) {
        console.error("Error al obtener las categorías:", error);
        res.status(500).json({ message: "Error al obtener las categorías", error: error.message });
    }
};

// Obtener una categoría por ID
export const getCategoriaById = async (req, res) => {
    try {
        const { id } = req.params;

        const categoria = await Categorias.findById(id);

        if (!categoria) {
            return res.status(404).json({ message: "Categoría no encontrada" });
        }

        res.status(200).json(categoria);
    } catch (error) {
        console.error("Error al obtener la categoría:", error);
        res.status(500).json({ message: "Error al obtener la categoría", error: error.message });
    }
};

// Actualizar una categoría
export const updateCategoria = async (req, res) => {
    try {
      const { id } = req.params; 
      const { nombre, descripcion } = req.body;
  
      
      if (!nombre || !descripcion) {
        return res.status(400).json({ message: "Nombre y descripción son obligatorios." });
      }
  
      
      const updatedCategoria = await Categorias.findByIdAndUpdate(
        id,
        { nombre, descripcion },
        { new: true }
      );
  
      if (!updatedCategoria) {
        return res.status(404).json({ message: "Categoría no encontrada." });
      }
  
      res.status(200).json(updatedCategoria); 
    } catch (error) {
      console.error("Error al actualizar la categoría:", error);
      res.status(500).json({ message: "Error al actualizar la categoría.", error: error.message });
    }
  };
  


export const toggleCategoriaState = async (req, res) => {
    try {
        const { id } = req.params;
        const { estado } = req.body;

       
        if (!["1", "0"].includes(estado)) {
            return res.status(400).json({ message: "Estado no válido. Debe ser '1' (activo) o '0' (inactivo)" });
        }

        const updatedCategoria = await Categorias.findByIdAndUpdate(
            id,
            { estado },
            { new: true } 
        );

        if (!updatedCategoria) {
            return res.status(404).json({ message: "Categoría no encontrada" });
        }

        res.status(200).json(updatedCategoria);
    } catch (error) {
        console.error("Error al cambiar el estado de la categoría:", error);
        res.status(500).json({ message: "Error al cambiar el estado de la categoría", error: error.message });
    }
};

export default {
    createCategoria,
    getCategorias,
    getCategoriaById,
    updateCategoria,
    toggleCategoriaState,
};