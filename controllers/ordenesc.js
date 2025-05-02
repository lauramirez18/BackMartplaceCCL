import Ordenes from "../models/ordenes.js";
import Usuarios from "../models/usuarios.js";
import Productos from "../models/productos.js";
import { sendInvoiceEmail } from "../utils/mailer.js";

// Crear una nueva orden
export const createOrden = async (req, res) => {
    try {
        const { usuarioId, products } = req.body;

        const usuario = await Usuarios.findById(usuarioId);
        if (!usuario) return res.status(404).json({ message: "Usuario no encontrado" });

        let total = 0;
        let detallesProductos = '';

        for (const item of products) {
            const producto = await Productos.findById(item.productId);
            if (!producto) return res.status(404).json({ message: `Producto ${item.productId} no encontrado` });

            total += item.quantity * producto.precio;
            detallesProductos += `- ${producto.nombre} x ${item.quantity} = $${(producto.precio * item.quantity).toFixed(2)}\n`;
        }

        const nuevaOrden = new Ordenes({
            usuarioId,
            products,
            total,
            status: 'pendiente'
        });

        await nuevaOrden.save();

        // Enviar email de confirmación
        const emailSubject = 'Confirmación de tu Orden - CCL';
        const emailText = `
Hola ${usuario.nombre},

¡Gracias por tu compra en CCL!

Detalles de tu orden:
${detallesProductos}

Total: $${total.toFixed(2)}

Estado de la orden: pendiente

Nos comunicaremos contigo en breve.

Saludos,
Equipo de CCL`;

        await sendInvoiceEmail(usuario.email, emailSubject, emailText, null);

        res.status(201).json(nuevaOrden);
    } catch (error) {
        console.error('Error creando orden:', error);
        res.status(500).json({ message: error.message });
    }
};

// Obtener todas las órdenes
export const getOrdenes = async (req, res) => {
    try {
        const ordenes = await Ordenes.find()
            .populate('usuarioId', 'nombre email')
            .populate('products.productId', 'nombre precio');
        res.status(200).json(ordenes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Obtener una orden por ID
export const getOrdenById = async (req, res) => {
    try {
        const { id } = req.params;
        const orden = await Ordenes.findById(id)
            .populate('usuarioId', 'nombre email')
            .populate('products.productId', 'nombre precio');

        if (!orden) return res.status(404).json({ message: "Orden no encontrada" });

        res.status(200).json(orden);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Actualizar el estado de una orden
export const updateOrden = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const estadosPermitidos = ['pendiente', 'pagado', 'cancelado'];
        if (!estadosPermitidos.includes(status)) {
            return res.status(400).json({ message: "Estado inválido. Usa 'pendiente', 'pagado' o 'cancelado'." });
        }

        const ordenActualizada = await Ordenes.findByIdAndUpdate(id, { status }, { new: true });

        if (!ordenActualizada) {
            return res.status(404).json({ message: "Orden no encontrada" });
        }

        res.status(200).json({ message: "Estado actualizado", orden: ordenActualizada });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export default {
    createOrden,
    getOrdenes,
    getOrdenById,
    updateOrden
};
