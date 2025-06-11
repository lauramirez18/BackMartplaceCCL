import Ordenes from "../models/ordenes.js";
import Usuarios from "../models/usuarios.js";
import Productos from "../models/productos.js";
import { sendInvoiceEmail } from "../utils/mailer.js";

// Crear una nueva orden
export const createOrden = async (req, res) => {
    try {
        // Ahora también extraemos el 'total' y 'shippingInfo' que envía el frontend
        const { usuarioId, products, total: totalFromFrontend, shippingInfo } = req.body;

        const usuario = await Usuarios.findById(usuarioId);
        if (!usuario) return res.status(404).json({ message: "Usuario no encontrado" });

        let totalCalculadoEnBackend = 0;
        let detallesProductosParaEmail = '';

        // Aunque confiamos en el precio del frontend, es una buena práctica de seguridad
        // verificar que los productos existen.
        for (const item of products) {
            const productoDB = await Productos.findById(item.productId);
            if (!productoDB) return res.status(404).json({ message: `Producto con ID ${item.productId} no encontrado` });

            // --- CAMBIO CLAVE #1 ---
            // Usamos item.price (el precio con descuento enviado desde Vue)
            // en lugar de productoDB.precio (el precio original de la base de datos).
            totalCalculadoEnBackend += item.quantity * item.price;

            // --- CAMBIO CLAVE #2 ---
            // También usamos item.price para el detalle del email para que sea consistente.
            detallesProductosParaEmail += `- ${productoDB.nombre} x ${item.quantity} = $${(item.price * item.quantity).toFixed(2)}\n`;
        }

        // --- VALIDACIÓN FINAL ---
        // Comparamos el total que envió el frontend con el que acabamos de calcular.
        // Ahora deberían coincidir perfectamente.
        if (Math.abs(totalFromFrontend - totalCalculadoEnBackend) > 0.01) {
            return res.status(400).json({
                message: "El total no coincide con la suma de los productos. Esto puede indicar un error o manipulación de datos.",
                totalEnviado: totalFromFrontend,
                totalCalculado: totalCalculadoEnBackend,
            });
        }
        
        const nuevaOrden = new Ordenes({
            usuarioId,
            products,
            // Guardamos el total validado y calculado en el backend.
            total: totalCalculadoEnBackend,
            shippingInfo, // Guardamos la información de envío
            status: 'pendiente' // El estado inicial es 'pendiente' hasta que PayPal confirme
        });

        await nuevaOrden.save();
        
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
