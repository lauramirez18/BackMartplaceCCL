import Ordenes from "../models/ordenes.js";
import Usuarios from "../models/usuarios.js";
import Productos from "../models/productos.js";
import { sendInvoiceEmail } from "../utils/mailer.js";

// Crear una nueva orden
export const createOrden = async (req, res) => {
    try {
        const { usuarioId, products, paypalOrderId } = req.body;

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
            status: 'pendiente',
            paypalOrderId,
            paymentMethod: 'paypal'
        });

        await nuevaOrden.save();

        // Enviar email de confirmación con plantilla mejorada
        const emailSubject = 'Confirmación de tu Orden - CCL';
        const emailHTML = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f8f9fa; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        .order-details { background: #f8f9fa; padding: 15px; margin: 20px 0; }
        .total { font-size: 18px; font-weight: bold; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>¡Gracias por tu compra en CCL!</h2>
        </div>
        <div class="content">
            <p>Hola ${usuario.nombre},</p>
            <p>Hemos recibido tu orden y estamos procesándola.</p>
            
            <div class="order-details">
                <h3>Detalles de tu orden:</h3>
                <p>${detallesProductos.replace(/\n/g, '<br>')}</p>
                <p class="total">Total: $${total.toFixed(2)}</p>
            </div>

            <p>Estado de la orden: <strong>pendiente</strong></p>
            ${paypalOrderId ? `<p>ID de PayPal: ${paypalOrderId}</p>` : ''}
            
            <p>Nos comunicaremos contigo en breve con más detalles sobre el envío.</p>
        </div>
        <div class="footer">
            <p>Este es un email automático, por favor no respondas a este mensaje.</p>
            <p>© 2024 CCL. Todos los derechos reservados.</p>
        </div>
    </div>
</body>
</html>`;

        await sendInvoiceEmail(usuario.email, emailSubject, emailHTML, null);

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

// Obtener todas las órdenes de PayPal
export const getPayPalOrders = async (req, res) => {
    try {
        const paypalOrders = await Ordenes.find({ paymentMethod: 'paypal' })
            .populate('usuarioId', 'nombre email')
            .populate('products.productId', 'nombre precio')
            .sort({ createdAt: -1 });

        res.status(200).json(paypalOrders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Obtener detalles de una orden de PayPal específica
export const getPayPalOrderDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const orden = await Ordenes.findOne({ 
            _id: id,
            paymentMethod: 'paypal'
        })
        .populate('usuarioId', 'nombre email')
        .populate('products.productId', 'nombre precio');

        if (!orden) return res.status(404).json({ message: "Orden de PayPal no encontrada" });

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
    updateOrden,
    getPayPalOrders,
    getPayPalOrderDetails
};
