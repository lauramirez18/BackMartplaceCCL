import mongoose from "mongoose";

const OrdenesSchema = new mongoose.Schema({
    usuarioId: {
        type: mongoose.Schema.Types.ObjectId,
        required: [true, 'Usuario ID es requerido'],
        ref: 'Usuarios'
    },
    products: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            required: [true, 'ID de producto es requerido'],
            ref: 'Productos'
        },
        quantity: {
            type: Number,
            required: [true, 'Cantidad es requerida'],
            min: [1, 'Cantidad debe ser al menos 1']
        },
        price: {
            type: Number,
            required: [true, 'Precio es requerido'],
            min: [0, 'Precio debe ser mayor o igual a 0']
        }
    }],
    total: {
        type: Number,
        required: [true, 'Total es requerido'],
        min: [0, 'Total debe ser mayor o igual a 0']
    },
    status: {
        type: String,
        required: [true, 'Status es requerido'],enum: {
            values: ['pendiente', 'pagado', 'cancelado', 'error_stock'],
            message: 'Status debe ser uno de: pendiente, pagado, cancelado, error_stock'
        },
        default: 'pendiente'
    },
    
    // Información de envío - ESTRUCTURA PLANA
    shippingInfo: {
        firstName: {
            type: String,
     
            trim: true,
            minlength: [1, 'Nombre no puede estar vacío']
        },
        lastName: {
            type: String,
          
            trim: true,
            minlength: [1, 'Apellido no puede estar vacío']
        },
        phone: {
            type: String,
           
            trim: true,
            minlength: [1, 'Teléfono no puede estar vacío']
        },
        address: {
            type: String,
          
            trim: true,
            minlength: [1, 'Dirección no puede estar vacía']
        },
        city: {
            type: String,
        
            trim: true,
            minlength: [1, 'Ciudad no puede estar vacía']
        },
        state: {
            type: String,
            trim: true,
            default: ''
        },
        country: {
            type: String,
            trim: true,
            default: ''
        },
        postalCode: {
            type: String,
            trim: true,
            default: ''
        },
        notes: {
            type: String,
            trim: true,
            default: ''
        }
    },
    
    // Detalles del pago
    paymentDetails: {
        paypalOrderId: String,
        paypalPaymentId: String,
        payerEmail: String,
        payerName: String,
        amountPaid: String,
        currency: String,
        paymentTime: Date,
        paymentMethod: {
            type: String,
            default: 'paypal'
        }
    },
    
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Índices para optimizar búsquedas
OrdenesSchema.index({ usuarioId: 1 });
OrdenesSchema.index({ status: 1 });
OrdenesSchema.index({ createdAt: -1 });
OrdenesSchema.index({ 'paymentDetails.paypalOrderId': 1 });

// Métodos del esquema
OrdenesSchema.methods.calculateTotal = function() {
    // Usar el precio que ya viene en el producto (que ya debería incluir cualquier descuento)
    // Esto asegura que el cálculo coincida con lo que el usuario ve en el frontend
    const total = this.products.reduce((total, product) => {
        return total + (product.price * product.quantity);
    }, 0);
    
    return total;
};

// Middleware pre-save para validar que el total sea correcto
OrdenesSchema.pre('save', function(next) {
    if (this.isModified('products') || this.isNew) {
        console.log('=== Validando total de la orden ===');
        const calculatedTotal = this.calculateTotal();
        const difference = Math.abs(this.total - calculatedTotal);
        
        console.log('Total en la orden:', this.total);
        console.log('Total calculado:', calculatedTotal);
        console.log('Diferencia:', difference);
        
        if (difference > 0.01) {
            const errorMsg = `El total no coincide con la suma de los productos. ` +
                           `Esperado: ${this.total}, Calculado: ${calculatedTotal}, Diferencia: ${difference}`;
            console.error('Error de validación:', errorMsg);
            return next(new Error(errorMsg));
        }
        console.log('Validación de total exitosa');
    } else {
        console.log('No se validó el total (products no modificado)');
    }
    next();
});

// Crear el modelo
export default mongoose.model('Ordenes', OrdenesSchema);