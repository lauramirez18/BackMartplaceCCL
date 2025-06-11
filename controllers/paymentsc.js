import Ordenes from "../models/ordenes.js";
import Productos from "../models/productos.js";
import { sendInvoiceEmail } from "../utils/mailer.js";

export const createPayPalOrder = async (req, res) => {
  try {
    console.log('=== CREANDO ORDEN PAYPAL ===');
    console.log('Body completo recibido:', JSON.stringify(req.body, null, 2));
    console.log('Headers:', req.headers);
    console.log('User desde middleware:', req.user);
    
    const { usuarioId, products, total, shippingInfo } = req.body;
    
    // Log detallado de shippingInfo
    console.log('ShippingInfo recibido:', JSON.stringify(shippingInfo, null, 2));
    console.log('Tipo de shippingInfo:', typeof shippingInfo);
    
    // Validar datos requeridos básicos
    if (!usuarioId) {
      console.error('usuarioId faltante');
      return res.status(400).json({ message: "Usuario ID es requerido" });
    }
    
    if (!products || !Array.isArray(products) || products.length === 0) {
      console.error('Productos faltantes o inválidos:', products);
      return res.status(400).json({ message: "Productos son requeridos" });
    }
    
    if (!total || total <= 0) {
      console.error('Total inválido:', total);
      return res.status(400).json({ message: "Total debe ser mayor a 0" });
    }

    // Validar shippingInfo de manera más robusta
    if (!shippingInfo || typeof shippingInfo !== 'object') {
      console.error('ShippingInfo inválido:', shippingInfo);
      return res.status(400).json({ message: "Información de envío es requerida y debe ser un objeto" });
    }

    // Extraer y validar campos de shipping
    const {
      firstName,
      lastName,
      phone,
      address,
      city,
      state = '',
      country = '',
      postalCode = '',
      notes = ''
    } = shippingInfo;

    console.log('Campos extraídos:', {
      firstName,
      lastName,
      phone,
      address,
      city,
      state,
      country,
      postalCode,
      notes
    });

    // Validar campos requeridos con logging detallado
    const requiredFields = { firstName, lastName, phone, address, city };
    const missingFields = [];
    
    Object.entries(requiredFields).forEach(([key, value]) => {
      console.log(`Validando ${key}:`, value, typeof value, Boolean(value));
      if (!value || String(value).trim() === '') {
        missingFields.push(key);
      }
    });

    if (missingFields.length > 0) {
      console.error('Campos faltantes:', missingFields);
      return res.status(400).json({ 
        message: `Campos requeridos faltantes: ${missingFields.join(', ')}`,
        camposFaltantes: missingFields,
        datosRecibidos: shippingInfo
      });
    }

    // Validar productos (código existente)
    console.log('Validando productos y stock...');
    for (const item of products) {
      if (!item.productId) {
        return res.status(400).json({ message: "ID de producto requerido" });
      }
      
      const producto = await Productos.findById(item.productId);
      if (!producto) {
        return res.status(404).json({ 
          message: `Producto con ID ${item.productId} no encontrado` 
        });
      }
      
      if (producto.stock < item.quantity) {
        return res.status(400).json({
          message: `Stock insuficiente para ${producto.nombre}`,
          productoNombre: producto.nombre,
          stockDisponible: producto.stock,
          cantidadSolicitada: item.quantity
        });
      }
    }

    // Crear objeto de shipping limpio para Mongoose
    const cleanShippingInfo = {
      firstName: String(firstName).trim(),
      lastName: String(lastName).trim(),
      phone: String(phone).trim(),
      address: String(address).trim(),
      city: String(city).trim(),
      state: String(state || '').trim(),
      country: String(country || '').trim(),
      postalCode: String(postalCode || '').trim(),
      notes: String(notes || '').trim()
    };

    console.log('ShippingInfo limpio para Mongoose:', JSON.stringify(cleanShippingInfo, null, 2));

    // Crear la orden en la base de datos
    console.log('Creando orden en BD...');
    
    // Asegurarse de que los productos tengan el precio correcto
    const processedProducts = products.map(product => ({
      ...product,
      // Usar el precio que ya viene del frontend (que ya incluye descuentos si aplican)
      price: Number(product.price),
      // Asegurarnos de que la cantidad sea un número
      quantity: Number(product.quantity)
    }));
    
    const ordenData = {
      usuarioId,
      products: processedProducts,
      total: Number(total),
      shippingInfo: cleanShippingInfo,
      status: 'pendiente',
      createdAt: new Date()
    };

    console.log('Datos completos de orden:', JSON.stringify(ordenData, null, 2));

    const nuevaOrden = new Ordenes(ordenData);
    
    // Validar antes de guardar
    const validationError = nuevaOrden.validateSync();
    if (validationError) {
      console.error('Error de validación de Mongoose:', validationError);
      return res.status(400).json({
        message: "Error de validación",
        errors: Object.values(validationError.errors).map(err => err.message)
      });
    }

    const ordenGuardada = await nuevaOrden.save();
    console.log('Orden guardada exitosamente:', ordenGuardada._id);

    // Responder con datos de la orden
    res.status(201).json({
      _id: ordenGuardada._id,
      status: ordenGuardada.status,
      total: ordenGuardada.total,
      shippingInfo: ordenGuardada.shippingInfo,
      message: "Orden creada exitosamente"
    });

  } catch (error) {
    console.error('Error completo al crear orden:', error);
    console.error('Stack trace:', error.stack);
    
    // Manejar errores específicos de MongoDB
    if (error.name === 'ValidationError') {
      console.error('Errores de validación específicos:', error.errors);
      const validationErrors = Object.entries(error.errors).map(([field, err]) => {
        return `${field}: ${err.message}`;
      });
      return res.status(400).json({ 
        message: "Error de validación de datos",
        errors: validationErrors,
        fullError: error.errors
      });
    }
    
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        message: "ID inválido proporcionado",
        field: error.path,
        value: error.value
      });
    }
    
    res.status(500).json({ 
      message: "Error interno del servidor",
      error: process.env.NODE_ENV === 'development' ? {
        message: error.message,
        stack: error.stack
      } : { message: "Error interno" }
    });
  }
};


// Handle PayPal payment confirmation
export const handlePayPalPayment = async (req, res) => {
  try {
    console.log('=== CONFIRMANDO PAGO PAYPAL ===');
    const { orderId, paymentDetails } = req.body;
    console.log('Datos recibidos:', { orderId, paymentDetails });

    // Validar datos requeridos
    if (!orderId) {
      return res.status(400).json({ message: "ID de orden requerido" });
    }
    
    if (!paymentDetails) {
      return res.status(400).json({ message: "Detalles de pago requeridos" });
    }

    // Buscar la orden
    const orden = await Ordenes.findById(orderId);
    if (!orden) {
      console.log('Orden no encontrada:', orderId);
      return res.status(404).json({ message: "Orden no encontrada" });
    }
    
    console.log('Orden encontrada:', {
      id: orden._id,
      status: orden.status,
      total: orden.total
    });

    // Verificar que la orden no haya sido procesada previamente
    if (orden.status === 'pagado') {
      console.log('Orden ya fue procesada');
      return res.status(400).json({ message: "Esta orden ya fue procesada" });
    }

    // Actualizar estado de la orden
    orden.status = 'pagado';
    orden.paymentDetails = {
      paypalOrderId: paymentDetails.id,
      paypalPaymentId: paymentDetails.purchase_units[0]?.payments?.captures[0]?.id,
      payerEmail: paymentDetails.payer?.email_address,
      payerName: `${paymentDetails.payer?.name?.given_name} ${paymentDetails.payer?.name?.surname}`,
      amountPaid: paymentDetails.purchase_units[0]?.amount?.value,
      currency: paymentDetails.purchase_units[0]?.amount?.currency_code,
      paymentTime: new Date()
    };
    
    await orden.save();
    console.log('Estado de orden actualizado a pagado');

    // Actualizar stock de productos
    console.log('Actualizando stock de productos...');
    const stockUpdates = [];
    
    for (const item of orden.products) {
      console.log('Procesando producto:', item);
      
      const producto = await Productos.findById(item.productId);
      if (!producto) {
        console.error(`Producto ${item.productId} no encontrado`);
        // No fallar aquí, solo loggar el error
        continue;
      }

      const stockAnterior = producto.stock;
      
      // Verificar stock nuevamente (por si cambió entre creación y pago)
      if (producto.stock < item.quantity) {
        console.error('Stock insuficiente en confirmación:', {
          producto: producto.nombre,
          stockDisponible: producto.stock,
          cantidadSolicitada: item.quantity
        });
        
        // Revertir el estado de la orden
        orden.status = 'error_stock';
        await orden.save();
        
        return res.status(400).json({
          message: `Stock insuficiente para ${producto.nombre}`,
          productoId: producto._id,
          stockDisponible: producto.stock,
          cantidadSolicitada: item.quantity
        });
      }

      // Actualizar stock
      producto.stock -= item.quantity;
      await producto.save();
      
      stockUpdates.push({
        producto: producto.nombre,
        stockAnterior,
        stockNuevo: producto.stock,
        cantidadVendida: item.quantity
      });
      
      console.log('Stock actualizado:', {
        producto: producto.nombre,
        stockAnterior,
        stockNuevo: producto.stock
      });
    }

    // Enviar email de confirmación
    try {
      const emailSubject = 'Confirmación de Pago - CCL';
      const emailText = `
Hola ${orden.paymentDetails.payerName},

¡Tu pago ha sido confirmado exitosamente!

Detalles del pago:
- ID de Orden: ${orden._id}
- Total Pagado: $${orden.paymentDetails.amountPaid} ${orden.paymentDetails.currency}
- Email: ${orden.paymentDetails.payerEmail}
- Fecha: ${new Date().toLocaleString('es-ES')}

Información de envío:
- Nombre: ${orden.shippingInfo.firstName} ${orden.shippingInfo.lastName}
- Dirección: ${orden.shippingInfo.address}
- Ciudad: ${orden.shippingInfo.city}
- Teléfono: ${orden.shippingInfo.phone}

Tu pedido será procesado en las próximas 24-48 horas.

Gracias por tu compra,
Equipo de CCL`;

      await sendInvoiceEmail(
        orden.paymentDetails.payerEmail, 
        emailSubject, 
        emailText, 
        null
      );
      console.log('Email de confirmación enviado a:', orden.paymentDetails.payerEmail);
    } catch (emailError) {
      console.error('Error enviando email:', emailError);
      // No fallar la transacción por error de email
    }

    // Respuesta exitosa
    res.status(200).json({
      message: "Pago procesado exitosamente",
      order: {
        id: orden._id,
        status: orden.status,
        total: orden.total,
        paymentDetails: orden.paymentDetails
      },
      stockUpdates
    });

  } catch (error) {
    console.error('Error procesando pago:', error);
    res.status(500).json({ 
      message: "Error interno del servidor",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export default {
  handlePayPalPayment,
  createPayPalOrder
};