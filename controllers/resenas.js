import Reseña from '../utils/resenas.js'
import Producto from '../models/productos.js'


export const crearReseña = async (req, res) => {
  try {

    if (!req.usuario) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    const { productoId, calificacion, comentario } = req.body;
    

    if (!productoId || !calificacion || !comentario) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }

   
    const nuevaReseña = new Reseña({
      producto: productoId,
      usuario: req.usuario.id,
      calificacion,
      comentario,
      nombreUsuario: req.usuario.nombre
    });

    await nuevaReseña.save();
    
    res.status(201).json(nuevaReseña);
    
  } catch (error) {
    console.error('Error en crearReseña:', error);
    res.status(500).json({ 
      error: 'Error al crear la reseña',
      detalle: error.message // Mejorar mensaje de error
    });
  }
};

// Obtener reseñas de un producto
export const obtenerReseñasProducto = async (req, res) => {
    try {
        const { productoId } = req.params
        const reseñas = await Reseña.find({ producto: productoId })
            .sort({ createdAt: -1 }) // Ordenar por fecha descendente

        res.json(reseñas)
    } catch (error) {
        res.status(500).json({ error: "Error al obtener reseñas" })
    }
}

// Eliminar una reseña (opcional)
export const eliminarReseña = async (req, res) => {
    try {
        const { id } = req.params
        const reseña = await Reseña.findByIdAndDelete(id)

        if (!reseña) {
            return res.status(404).json({ error: "Reseña no encontrada" })
        }

        // Actualizar el promedio del producto
        await actualizarPromedioProducto(reseña.producto)

        res.json({ mensaje: "Reseña eliminada" })
    } catch (error) {
        res.status(500).json({ error: "Error al eliminar la reseña" })
    }
}

// Función auxiliar para actualizar el promedio del producto
export const actualizarPromedioProducto = async (productoId) => {
    const reseñas = await Reseña.find({ producto: productoId })
    const promedio = reseñas.reduce((sum, r) => sum + r.calificacion, 0) / reseñas.length

    await Producto.findByIdAndUpdate(productoId, {
        promedioCalificacion: promedio || 0
    })
}

export default {
    crearReseña,
    obtenerReseñasProducto,
    eliminarReseña
}