import Ordenes from "../models/ordenes.js";
import Usuarios from "../models/usuarios.js";
import Productos from "../models/productos.js";
import { sendInvoiceEmail } from "../utils/mailer.js";

// Crear una nueva orden
export const createOrden = async (req, res) => {
    try {
        const { usuarioId, products, paypalOrderId, shippingInfo } = req.body;

        console.log('=== CREANDO ORDEN ===');
        console.log('Datos recibidos:', { usuarioId, products, paypalOrderId, shippingInfo });

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

        // Si hay un ID de PayPal, la orden comienza como pagada
        const status = paypalOrderId ? 'pagado' : 'pendiente';

        const nuevaOrden = new Ordenes({
            usuarioId,
            products,
            total,
            status,
            paypalOrderId,
            paymentMethod: 'paypal',
            shippingInfo
        });

        await nuevaOrden.save();
        console.log('Orden creada:', nuevaOrden);

        // Enviar email de confirmación
        const emailSubject = paypalOrderId ? 
            '¡Pago Confirmado - CCL!' : 
            'Confirmación de tu Orden - CCL';
        const emailHTML = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
        
        body {
            font-family: 'Poppins', Arial, sans-serif;
            line-height: 1.6;
            color: #2d3748;
            margin: 0;
            padding: 0;
            background-color: #f7fafc;
        }
        
        .container {
            max-width: 600px;
            margin: 20px auto;
            background: #ffffff;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        
        .header {
            background: linear-gradient(135deg, #4a90e2 0%, #2c5282 100%);
            padding: 30px 20px;
            text-align: center;
            color: white;
        }
        
        .header h2 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
        }
        
        .content {
            padding: 30px;
        }
        
        .welcome-message {
            font-size: 18px;
            color: #4a5568;
            margin-bottom: 25px;
        }
        
        .order-details {
            background: #f8fafc;
            border-radius: 8px;
            padding: 20px;
            margin: 25px 0;
            border: 1px solid #e2e8f0;
        }
        
        .order-details h3 {
            color: #2d3748;
            margin-top: 0;
            font-size: 20px;
            border-bottom: 2px solid #4a90e2;
            padding-bottom: 10px;
        }
        
        .product-item {
            padding: 10px 0;
            border-bottom: 1px solid #e2e8f0;
        }
        
        .product-item:last-child {
            border-bottom: none;
        }
        
        .total {
            font-size: 20px;
            font-weight: 600;
            color: #2d3748;
            margin-top: 20px;
            text-align: right;
            padding-top: 15px;
            border-top: 2px solid #e2e8f0;
        }
        
        .shipping-info {
            background: #f8fafc;
            border-radius: 8px;
            padding: 20px;
            margin: 25px 0;
            border: 1px solid #e2e8f0;
        }
        
        .shipping-info h3 {
            color: #2d3748;
            margin-top: 0;
            font-size: 20px;
            border-bottom: 2px solid #4a90e2;
            padding-bottom: 10px;
        }
        
        .info-row {
            margin: 10px 0;
            display: flex;
            align-items: center;
        }
        
        .info-label {
            font-weight: 500;
            color: #4a5568;
            width: 150px;
        }
        
        .info-value {
            color: #2d3748;
            flex: 1;
        }
        
        .status-badge {
            display: inline-block;
            padding: 8px 16px;
            background: #ebf8ff;
            color: #2b6cb0;
            border-radius: 20px;
            font-weight: 500;
            margin: 10px 0;
        }
        
        .footer {
            text-align: center;
            padding: 20px;
            background: #f8fafc;
            color: #718096;
            font-size: 14px;
            border-top: 1px solid #e2e8f0;
        }
        
        .social-links {
            margin: 15px 0;
        }
        
        .social-links a {
            color: #4a90e2;
            text-decoration: none;
            margin: 0 10px;
        }
        
        .button {
            display: inline-block;
            padding: 12px 24px;
            background: #4a90e2;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 500;
            margin: 20px 0;
        }
        
        .button:hover {
            background: #2c5282;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>¡Gracias por tu compra en CCL!</h2>
        </div>
        <div class="content">
            <div class="welcome-message">
                <p>Hola ${usuario.name},</p>
                <p>¡Nos complace informarte que hemos recibido tu orden y estamos procesándola con entusiasmo!</p>
            </div>
            
            <div class="order-details">
                <h3>Detalles de tu orden</h3>
                ${detallesProductos.split('\n').map(item => `
                    <div class="product-item">
                        ${item.replace('- ', '')}
                    </div>
                `).join('')}
                <div class="total">
                    Total: $${total.toFixed(2)}
                </div>
            </div>

            <div class="shipping-info">
                <h3>Información de envío</h3>
                <div class="info-row">
                    <span class="info-label">Nombre:</span>
                    <span class="info-value">${shippingInfo.firstName} ${shippingInfo.lastName}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Dirección:</span>
                    <span class="info-value">${shippingInfo.address}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Ciudad:</span>
                    <span class="info-value">${shippingInfo.city}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Estado/Departamento:</span>
                    <span class="info-value">${shippingInfo.state}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">País:</span>
                    <span class="info-value">${shippingInfo.country}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Código Postal:</span>
                    <span class="info-value">${shippingInfo.postalCode}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Teléfono:</span>
                    <span class="info-value">${shippingInfo.phone}</span>
                </div>
                ${shippingInfo.notes ? `
                <div class="info-row">
                    <span class="info-label">Notas de entrega:</span>
                    <span class="info-value">${shippingInfo.notes}</span>
                </div>
                ` : ''}
            </div>

            <div class="status-badge">
                Estado de la orden: ${status}
            </div>
            
            ${paypalOrderId ? `
            <div class="info-row">
                <span class="info-label">ID de PayPal:</span>
                <span class="info-value">${paypalOrderId}</span>
            </div>
            ` : ''}
            
            <p>Nos comunicaremos contigo pronto con más detalles sobre el envío de tu pedido.</p>
            
            <a href="https://tudominio.com/mi-cuenta" class="button">Ver mi orden</a>
        </div>
        <div class="footer">
            <div class="social-links">
                <a href="#">Facebook</a> |
                <a href="#">Instagram</a> |
                <a href="#">Twitter</a>
            </div>
            <p>Este es un email automático, por favor no respondas a este mensaje.</p>
            <p>© 2024 CCL. Todos los derechos reservados.</p>
        </div>
    </div>
</body>
</html>`;

        await sendInvoiceEmail(usuario.email, emailSubject, emailHTML, null);

        res.status(201).json({
            success: true,
            message: paypalOrderId ? 
                "Orden creada y pago confirmado" : 
                "Orden creada exitosamente",
            orden: {
                _id: nuevaOrden._id,
                status: nuevaOrden.status,
                total: nuevaOrden.total,
                paypalOrderId: nuevaOrden.paypalOrderId
            }
        });
    } catch (error) {
        console.error('Error creando orden:', error);
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
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

// Obtener órdenes por ID de usuario
export const getOrdenesByUsuario = async (req, res) => {
    try {
        const { usuarioId } = req.params;
        
        // Verificar que el usuario existe
        const usuario = await Usuarios.findById(usuarioId);
        if (!usuario) {
            return res.status(404).json({ 
                success: false,
                message: "Usuario no encontrado" 
            });
        }

        // Buscar todas las órdenes del usuario y poblar la información necesaria
        const ordenes = await Ordenes.find({ usuarioId })
            .populate({
                path: 'products.productId',
                select: 'nombre precio imagenes marca category',
                populate: [
                    { path: 'marca', select: 'nombre logo' },
                    { path: 'category', select: 'name' }
                ]
            })
            .sort({ createdAt: -1 }); // Ordenar por fecha de creación, más recientes primero

        // Formatear la respuesta para incluir información relevante
        const ordenesFormateadas = ordenes.map(orden => ({
            _id: orden._id,
            fecha: orden.createdAt,
            total: orden.total,
            status: orden.status,
            productos: orden.products.map(producto => ({
                nombre: producto.productId.nombre,
                precio: producto.price,
                cantidad: producto.quantity,
                imagen: producto.productId.imagenes[0], // Primera imagen del producto
                marca: producto.productId.marca?.nombre,
                categoria: producto.productId.category?.name,
                subtotal: producto.price * producto.quantity
            })),
            shippingInfo: orden.shippingInfo,
            paypalOrderId: orden.paypalOrderId,
            paymentMethod: orden.paymentMethod
        }));

        // Agrupar órdenes por estado
        const ordenesPorEstado = {
            pendiente: ordenesFormateadas.filter(orden => orden.status === 'pendiente'),
            pagado: ordenesFormateadas.filter(orden => orden.status === 'pagado'),
            cancelado: ordenesFormateadas.filter(orden => orden.status === 'cancelado')
        };

        res.status(200).json({
            success: true,
            totalOrdenes: ordenes.length,
            ordenesPorEstado,
            todasLasOrdenes: ordenesFormateadas
        });
    } catch (error) {
        console.error('Error al obtener órdenes del usuario:', error);
        res.status(500).json({ 
            success: false,
            message: "Error al obtener las órdenes",
            error: error.message 
        });
    }
};

// Actualizar estado de orden cuando se confirma el pago de PayPal
export const confirmarPagoPayPal = async (req, res) => {
    try {
        const { orderId, paypalOrderId } = req.body;

        console.log('=== CONFIRMANDO PAGO PAYPAL ===');
        console.log('Datos recibidos:', { orderId, paypalOrderId });

        // Primero buscar la orden por ID
        const orden = await Ordenes.findById(orderId);

        if (!orden) {
            console.log('Orden no encontrada');
            return res.status(404).json({
                success: false,
                message: "Orden no encontrada"
            });
        }

        // Verificar si la orden ya tiene un ID de PayPal
        if (orden.paypalOrderId && orden.paypalOrderId !== paypalOrderId) {
            console.log('ID de PayPal no coincide');
            return res.status(400).json({
                success: false,
                message: "ID de PayPal no coincide con la orden"
            });
        }

        // Actualizar el ID de PayPal y el estado de la orden
        orden.paypalOrderId = paypalOrderId;
        orden.status = 'pagado';
        await orden.save();

        console.log('Orden actualizada:', orden);

        // Obtener el usuario para enviar email de confirmación
        const usuario = await Usuarios.findById(orden.usuarioId);
        
        // Enviar email de confirmación de pago
        const emailSubject = '¡Pago Confirmado - CCL!';
        const emailHTML = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
        
        body {
            font-family: 'Poppins', Arial, sans-serif;
            line-height: 1.6;
            color: #2d3748;
            margin: 0;
            padding: 0;
            background-color: #f7fafc;
        }
        
        .container {
            max-width: 600px;
            margin: 20px auto;
            background: #ffffff;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        
        .header {
            background: linear-gradient(135deg, #4a90e2 0%, #2c5282 100%);
            padding: 30px 20px;
            text-align: center;
            color: white;
        }
        
        .header h2 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
        }
        
        .content {
            padding: 30px;
        }
        
        .status-badge {
            display: inline-block;
            padding: 8px 16px;
            background: #c6f6d5;
            color: #2f855a;
            border-radius: 20px;
            font-weight: 500;
            margin: 10px 0;
        }
        
        .order-details {
            background: #f8fafc;
            border-radius: 8px;
            padding: 20px;
            margin: 25px 0;
            border: 1px solid #e2e8f0;
        }
        
        .footer {
            text-align: center;
            padding: 20px;
            background: #f8fafc;
            color: #718096;
            font-size: 14px;
            border-top: 1px solid #e2e8f0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>¡Pago Confirmado!</h2>
        </div>
        <div class="content">
            <p>Hola ${usuario.name},</p>
            <p>¡Excelente noticia! Tu pago ha sido confirmado y estamos procesando tu pedido.</p>
            
            <div class="status-badge">
                Estado de la orden: Pagado
            </div>
            
            <div class="order-details">
                <h3>Detalles de tu orden</h3>
                <p>ID de la orden: ${orden._id}</p>
                <p>Total pagado: $${orden.total.toFixed(2)}</p>
                <p>Método de pago: PayPal</p>
                <p>ID de PayPal: ${orden.paypalOrderId}</p>
            </div>

            <p>Nos pondremos en contacto contigo pronto con los detalles del envío.</p>
            <p>¡Gracias por tu compra!</p>
        </div>
        <div class="footer">
            <p>Este es un email automático, por favor no respondas a este mensaje.</p>
            <p>© 2024 CCL. Todos los derechos reservados.</p>
        </div>
    </div>
</body>
</html>`;

        await sendInvoiceEmail(usuario.email, emailSubject, emailHTML, null);

        res.status(200).json({
            success: true,
            message: "Pago confirmado y orden actualizada",
            orden: {
                _id: orden._id,
                status: orden.status,
                total: orden.total,
                paypalOrderId: orden.paypalOrderId
            }
        });

    } catch (error) {
        console.error('Error al confirmar pago:', error);
        res.status(500).json({
            success: false,
            message: "Error al confirmar el pago",
            error: error.message
        });
    }
};

export default {
    createOrden,
    getOrdenes,
    getOrdenById,
    updateOrden,
    getPayPalOrders,
    getPayPalOrderDetails,
    getOrdenesByUsuario,
    confirmarPagoPayPal
};
