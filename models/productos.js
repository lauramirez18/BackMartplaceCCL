import mongoose from 'mongoose';

const productoSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  descripcion: {
    type: String,
    required: true
  },
  precio: {
    type: Number,
    required: true,
    min: 0
  },
  marca: {
    type: String,
    required: true
  },
  imagen: {
    type: String,
    required: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Categoria',
    required: true
  },
  subcategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subcategoria',
    required: true
  },
  detalles: {
    type: Object,
    required: true
  },
  stock: {
    type: Number,
    required: true,
    min: 0
  },
  state: {
    type: String,
    enum: ['1', '0'],
    default: '1'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { versionKey: false });

export default mongoose.model('Producto', productoSchema);