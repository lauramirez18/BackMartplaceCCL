// controllers/resenas.js
import Reseña from '../utils/resenas.js' // Assuming you moved this to models/resenas.js
import Producto from '../models/productos.js'
import Usuario from '../models/usuarios.js' // Assuming you have a user model now

// Helper function to update product's average rating
export const actualizarPromedioProducto = async (productoId) => {
    try {
        const reseñas = await Reseña.find({ producto: productoId });
        const totalCalificaciones = reseñas.reduce((sum, r) => sum + r.calificacion, 0);
        const promedio = reseñas.length > 0 ? totalCalificaciones / reseñas.length : 0;

        // Ensure promedio is a number and not NaN
        const finalPromedio = isNaN(promedio) ? 0 : parseFloat(promedio.toFixed(1)); // To one decimal place

        await Producto.findByIdAndUpdate(productoId, {
            promedioCalificacion: finalPromedio
        }, { new: true }); // {new: true} returns the updated document
        console.log(`Promedio de calificación actualizado para producto ${productoId}: ${finalPromedio}`);
    } catch (error) {
        console.error('Error al actualizar promedio del producto:', error);
        // You might want to throw an error or handle it more gracefully
    }
};


export const crearReseña = async (req, res) => {
    try {
        // req.usuario comes from validarJWT middleware
        if (!req.usuario || !req.usuario.id) {
            return res.status(401).json({ msg: 'No autorizado: Token no válido o usuario no encontrado.' });
        }

        const { productoId, calificacion, comentario } = req.body;

        if (!productoId || !calificacion || !comentario) {
            return res.status(400).json({ msg: 'Faltan campos requeridos: productoId, calificacion y comentario son obligatorios.' });
        }

        if (calificacion < 1 || calificacion > 5) {
            return res.status(400).json({ msg: 'La calificación debe estar entre 1 y 5.' });
        }

        // Check if the product exists
        const productoExiste = await Producto.findById(productoId);
        if (!productoExiste) {
            return res.status(404).json({ msg: 'Producto no encontrado.' });
        }

        // Check if the user has already reviewed this product (optional, but good for unique reviews per user)
        const reseñaExistente = await Reseña.findOne({ producto: productoId, usuario: req.usuario.id });
        if (reseñaExistente) {
            return res.status(409).json({ msg: 'Ya has enviado una reseña para este producto. Puedes editarla en su lugar.' });
        }

        const nuevaReseña = new Reseña({
            producto: productoId,
            usuario: req.usuario.id, // Store user ID
            calificacion,
            comentario,
            // Assuming req.usuario.name holds the user's name from JWT payload or DB lookup
            nombreUsuario: req.usuario.name || 'Usuario Anónimo JWT' // Fallback in case name isn't in JWT
        });

        await nuevaReseña.save();

        // Populate the user name for the response so the frontend gets it immediately
        const reseñaGuardada = await Reseña.findById(nuevaReseña._id)
            .populate({ path: 'usuario', select: 'name' }); // Populate only 'name'

        // Update product average rating AFTER saving the new review
        await actualizarPromedioProducto(productoId);

        res.status(201).json({ msg: 'Reseña creada exitosamente', reseña: reseñaGuardada });

    } catch (error) {
        console.error('Error en crearReseña:', error);
        res.status(500).json({
            msg: 'Error interno del servidor al crear la reseña',
            detalle: error.message
        });
    }
};

// Obtener reseñas de un producto
export const obtenerReseñasProducto = async (req, res) => {
    try {
        const { productoId } = req.params;

        // Check if the product exists before fetching reviews
        const productoExiste = await Producto.findById(productoId);
        if (!productoExiste) {
            return res.status(404).json({ msg: 'Producto no encontrado.' });
        }

        const reseñas = await Reseña.find({ producto: productoId })
            .populate({ // Crucial: Populate the 'usuario' field
                path: 'usuario',
                select: 'name' // Only get the 'name' field from the User document
            })
            .sort({ createdAt: -1 }); // Order by creation date descending (latest first)

        // Map reviews to ensure `nombreUsuario` is present from `usuario.name` for consistency
        const reseñasFormateadas = reseñas.map(reseña => ({
            _id: reseña._id,
            producto: reseña.producto,
            usuario: reseña.usuario, // This will be the populated user object { _id, name }
            calificacion: reseña.calificacion,
            comentario: reseña.comentario,
            fecha: reseña.fecha,
            createdAt: reseña.createdAt,
            updatedAt: reseña.updatedAt,
            // Prioritize populated user name, fallback to stored nombreUsuario, then a generic fallback
            nombreUsuario: reseña.usuario ? reseña.usuario.name : (reseña.nombreUsuario || 'Usuario Anónimo (sin pop.)')
        }));


        res.json(reseñasFormateadas);
    } catch (error) {
        console.error('Error al obtener reseñas del producto:', error);
        res.status(500).json({
            msg: 'Error interno del servidor al obtener las reseñas',
            detalle: error.message
        });
    }
};

// Eliminar una reseña
export const eliminarReseña = async (req, res) => {
    try {
        const { id } = req.params; // Review ID
        const userId = req.usuario.id; // User ID from JWT

        if (!userId) {
            return res.status(401).json({ msg: 'No autorizado para eliminar esta reseña.' });
        }

        const reseña = await Reseña.findById(id);

        if (!reseña) {
            return res.status(404).json({ msg: 'Reseña no encontrada.' });
        }

        // Authorization check: Only the review owner or an admin can delete
        if (reseña.usuario.toString() !== userId.toString()) {
            // You might want to add role-based access here (e.g., if (req.usuario.role !== 'admin'))
            return res.status(403).json({ msg: 'No tienes permiso para eliminar esta reseña.' });
        }

        const productoId = reseña.producto; // Get product ID before deleting
        await Reseña.findByIdAndDelete(id);

        // Actualizar el promedio del producto después de eliminar la reseña
        await actualizarPromedioProducto(productoId);

        res.json({ msg: 'Reseña eliminada exitosamente.' });
    } catch (error) {
        console.error('Error al eliminar la reseña:', error);
        res.status(500).json({
            msg: 'Error interno del servidor al eliminar la reseña',
            detalle: error.message
        });
    }
};