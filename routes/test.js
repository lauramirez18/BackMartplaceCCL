import express from 'express';
import { sendInvoiceEmail } from '../utils/mailer.js';
import Ordenes from '../models/ordenes.js';
import Usuarios from '../models/usuarios.js';

const router = express.Router();

router.get('/test-email', async (req, res) => {
  try {
    console.log('Intentando enviar email de prueba...');
    console.log('Configuración de correo:', {
      user: process.env.EMAIL_USER,
      // No mostramos la contraseña por seguridad
      pass: process.env.EMAIL_PASS ? '******' : 'No configurada'
    });

    await sendInvoiceEmail(
      'tiendavirtualccl@gmail.com',
      'Test Email from CCL',
      `
        <h1>Test Email</h1>
        <p>Si recibes este correo, la configuración de email está funcionando correctamente!</p>
        <p>Fecha y hora de prueba: ${new Date().toLocaleString()}</p>
      `,
      null
    );
    
    res.status(200).json({ 
      success: true,
      message: '✅ Email enviado correctamente',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error al enviar email:', error);
    res.status(500).json({ 
      success: false,
      message: '❌ Error enviando email', 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

router.get('/test-order-email', async (req, res) => {
  try {
    console.log('=== INICIANDO PRUEBA DE ENVÍO DE CORREO ===');
    
    // Datos de prueba
    const testOrder = {
      usuarioId: req.query.userId || '65f2e8b7c261e6001234abcd', // Reemplaza con un ID válido de tu base de datos
      products: [
        {
          productId: '65f2e8b7c261e6001234abcd',
          quantity: 2,
          price: 50000,
          name: 'Producto de prueba 1'
        },
        {
          productId: '65f2e8b7c261e6001234abcd',
          quantity: 1,
          price: 75000,
          name: 'Producto de prueba 2'
        }
      ],
      shippingInfo: {
        firstName: 'Juan',
        lastName: 'Pérez',
        phone: '+573001234567',
        address: 'Calle 123 #45-67',
        city: 'Bogotá',
        state: 'Cundinamarca',
        country: 'Colombia',
        postalCode: '110111',
        notes: 'Apartamento 502'
      },
      total: 175000,
      paypalOrderId: 'TEST-ORDER-123'
    };

    // Buscar usuario
    const usuario = await Usuarios.findById(testOrder.usuarioId);
    if (!usuario) {
      return res.status(404).json({ 
        success: false, 
        message: 'Usuario no encontrado. Por favor, proporciona un ID de usuario válido en la URL como ?userId=ID_VALIDO' 
      });
    }

    console.log('Usuario encontrado:', usuario.email);

    // Crear detalles del producto para el correo
    let detallesProductos = '';
    testOrder.products.forEach(product => {
      detallesProductos += `- ${product.name} x ${product.quantity} = $${(product.price * product.quantity).toFixed(2)}\n`;
    });

    // Plantilla del correo
    const emailSubject = 'Prueba de Factura - CCL';
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
        .shipping-info { margin-top: 20px; padding: 15px; background: #f8f9fa; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>¡Prueba de Factura - CCL!</h2>
        </div>
        <div class="content">
            <p>Hola ${usuario.name},</p>
            <p>Esta es una prueba del sistema de envío de facturas.</p>
            
            <div class="order-details">
                <h3>Detalles de la orden de prueba:</h3>
                <p>${detallesProductos.replace(/\n/g, '<br>')}</p>
                <p class="total">Total: $${testOrder.total.toFixed(2)}</p>
            </div>

            <div class="shipping-info">
                <h3>Información de envío de prueba:</h3>
                <p><strong>Nombre:</strong> ${testOrder.shippingInfo.firstName} ${testOrder.shippingInfo.lastName}</p>
                <p><strong>Dirección:</strong> ${testOrder.shippingInfo.address}</p>
                <p><strong>Ciudad:</strong> ${testOrder.shippingInfo.city}</p>
                <p><strong>Estado/Departamento:</strong> ${testOrder.shippingInfo.state}</p>
                <p><strong>País:</strong> ${testOrder.shippingInfo.country}</p>
                <p><strong>Código Postal:</strong> ${testOrder.shippingInfo.postalCode}</p>
                <p><strong>Teléfono:</strong> ${testOrder.shippingInfo.phone}</p>
                <p><strong>Notas de entrega:</strong> ${testOrder.shippingInfo.notes}</p>
            </div>

            <p>ID de PayPal de prueba: ${testOrder.paypalOrderId}</p>
        </div>
        <div class="footer">
            <p>Este es un email de prueba, por favor no respondas a este mensaje.</p>
            <p>© 2024 CCL. Todos los derechos reservados.</p>
        </div>
    </div>
</body>
</html>`;

    // Enviar el correo
    await sendInvoiceEmail(usuario.email, emailSubject, emailHTML, null);

    res.status(200).json({ 
      success: true,
      message: '✅ Correo de prueba enviado correctamente',
      sentTo: usuario.email,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error en la prueba de correo:', error);
    res.status(500).json({ 
      success: false,
      message: '❌ Error enviando correo de prueba',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
