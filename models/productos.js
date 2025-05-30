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
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Marca',
    required: true
  },
  imagenes: [{
    type: String,
    required: true
  }],
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
  especificaciones: {
    type: Object,
    required: true,
    default: {} // Añadido valor por defecto
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
}, {
  versionKey: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Añadir índice de texto solo para los campos necesarios
productoSchema.index({
  nombre: 'text',
  descripcion: 'text',
  'especificaciones.tipo': 'text'
}, {
  name: 'product_search_index'
});

// Virtual para imagen principal (se mantiene igual)
productoSchema.virtual('imagenPrincipal').get(function () {
  return this.imagenes.length > 0 ? this.imagenes[0] : null;
});

export default mongoose.model('Producto', productoSchema);