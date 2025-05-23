// models/productos.js

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
    required: true,
    logo : { type: String }
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
}, {
  versionKey: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});


productoSchema.virtual('imagenPrincipal').get(function() {
  return this.imagenes.length > 0 ? this.imagenes[0] : null;
});

export default mongoose.model('Producto', productoSchema);