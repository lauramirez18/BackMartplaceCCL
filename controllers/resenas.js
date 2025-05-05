import Reseña from '../utils/resenas.js'
import Producto from '../models/productos.js'

// Crear una reseña
export const crearReseña = async (req, res) => {
    try {
        const { productoId, calificacion, comentario } = req.body
        const usuarioId = req.usuario._id // Si usas autenticación

        // Validación básica
        if (!productoId || !calificacion) {
            return res.status(400).json({ error: "Faltan campos obligatorios" })
        }

        const nuevaReseña = new Reseña({
            producto: productoId,
            usuario: usuarioId,
            nombreUsuario: req.usuario.nombre, // Ejemplo si el usuario tiene un nombre
            calificacion,
            comentario: comentario || null
        })

        await nuevaReseña.save()

        // Actualizar el promedio de calificaciones del producto
        await actualizarPromedioProducto(productoId)

        res.status(201).json(nuevaReseña)
    } catch (error) {
        res.status(500).json({ error: "Error al crear la reseña" })
    }
}

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