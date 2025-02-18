const mongoose = require('mongoose');

// Definir el esquema de Ordenes
const OrdenesSchema = new mongoose.Schema({
    usuarioId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Usuarios' },// Ref a la colección User
    products: [{
        productId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Product' }, // Ref a la colección Product

        quantity: { type: Number, required: true },
        price: { type: Number, required: true }
    }],
    total: { type: Number, required: true },
    status: { type: String, required: true, enum: ['pendiente', 'pagado', 'cancelado'] },
    createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Crear el modelo
const Ordenes = mongoose.model('Ordenes', OrdenesSchema);

module.exports = Ordenes;