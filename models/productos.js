// models/productos.js
import mongoose from 'mongoose'

const productosSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    category: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Categorias', 
        required: true 
    },
    stock: { type: Number, required: true },
    img: { type: String, required: true },
    state: { type: String, default: '1' }
}, {
    timestamps: true,
    versionKey: false
})

export default mongoose.model('Productos', productosSchema)