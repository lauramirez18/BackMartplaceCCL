import mongoose from 'mongoose'

const reseñaSchema = new mongoose.Schema({
    producto: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Productos',
        required: true
    },
    usuario: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario', 
        required: true
    },
    nombreUsuario: { type: String, required: true }, 
    calificacion: { 
        type: Number, 
        required: true,
        min: 1,
        max: 5
    },
    comentario: { type: String },
    fecha: { type: Date, default: Date.now }
}, {
    timestamps: true,
    versionKey: false
})


reseñaSchema.post('save', async function() {
    const Producto = mongoose.model('Productos')
    const reseñas = await this.model.find({ producto: this.producto })
    const total = reseñas.reduce((sum, reseña) => sum + reseña.calificacion, 0)
    const promedio = total / reseñas.length
    
    await Producto.findByIdAndUpdate(this.producto, {
        promedioCalificacion: promedio
    })
})

export default mongoose.model('Reseña', reseñaSchema)