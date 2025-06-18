import mongoose from "mongoose";

// Definir el esquema de Ordenes
const OrdenesSchema = new mongoose.Schema({
    usuarioId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Usuario' },// Ref a la colección User
    products: [{
        productId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Producto' }, // Ref a la colección Product
        quantity: { type: Number, required: true },
        price: { type: Number, required: true }
    }],
    total: { type: Number, required: true },
    status: { type: String, required: true, enum: ['pendiente', 'pagado', 'cancelado'] },
    paypalOrderId: { type: String },
    paymentMethod: { type: String, default: 'paypal' },
    shippingInfo: {
        firstName: { type: String, required: true },
        lastName: { type: String, required: true },
        address: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        country: { type: String, required: true },
        postalCode: { type: String, required: true },
        phone: { type: String, required: true },
        notes: { type: String }
    },
    createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Crear el modelo
export default mongoose.model('Ordenes', OrdenesSchema);

