import mongoose from 'mongoose'

const reseñaSchema = new mongoose.Schema({
    producto: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Producto',
        required: true
    },
    usuario: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario', 
        required: true
    },
  
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




export default mongoose.model('Reseña', reseñaSchema)