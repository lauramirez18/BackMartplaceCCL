import mongoose from 'mongoose'

const productosSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    marca: { type: String, required: true },  
    price: { type: Number, required: true },
    category: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Categorias', 
        required: true 
    },
    stock: { type: Number, required: true },
    img: { type: String, required: true },
    state: { type: String, default: '1' },
    // Detalles técnicos del producto
    detalles: {
        referencia: { type: String },
        sistemaOperativo: { type: String },
        almacenamiento: { type: String },
        marcaProcesador: { type: String },
        tipoAlmacenamiento: { type: String },
        modeloProcesador: { type: String },
        marcaGrafica: { type: String },
        bateria: { type: String }
    },
    // Referencia a las reseñas
    reseñas: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Reseña'
    }],
    // Promedio de calificaciones (para no calcularlo siempre)
    promedioCalificacion: { type: Number, default: 0 }
}, {
    timestamps: true,
    versionKey: false
})

export default mongoose.model('Productos', productosSchema)