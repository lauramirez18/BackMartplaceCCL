import mongoose from "mongoose";

const InventarioSchema = new mongoose.Schema({
    productoId: {type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Productos' },// Ref a la colección Productos, si la tienes
    type: {type: String, required: true, enum: ['entrada', 'salida', 'devolucion']},
    quantity: {type: Number, required: true},
    date: {type: Date, default: Date.now},
    userId: {type: mongoose.Schema.Types.ObjectId, required: true,ref: 'Usuarios' },// Ref a la colección Usuarios, si la tienes
    reason: {type: String, default: 'Compra de proveedor:'},

}, { timestamps: true });

// Crear el modelo
export default mongoose.model('Inventario', InventarioSchema);