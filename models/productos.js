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
    default: {}
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
  // Campos para ofertas
  enOferta: {
    type: Boolean,
    default: false
  },
  porcentajeDescuento: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  precioOferta: {
    type: Number,
    min: 0,
    default: function() {
      return this.enOferta ? this.precio * (1 - this.porcentajeDescuento / 100) : this.precio;
    }
  },
  fechaInicioOferta: {
    type: Date,
    default: null
  },
  fechaFinOferta: {
    type: Date,
    default: null
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

// Virtual para imagen principal
productoSchema.virtual('imagenPrincipal').get(function () {
  return this.imagenes.length > 0 ? this.imagenes[0] : null;
});

// Virtual para verificar si la oferta está activa
productoSchema.virtual('ofertaActiva').get(function() {
  if (!this.enOferta) return false;
  
  const now = new Date();
  const inicioValido = !this.fechaInicioOferta || now >= this.fechaInicioOferta;
  const finValido = !this.fechaFinOferta || now <= this.fechaFinOferta;
  
  return inicioValido && finValido;
});

// Pre-save hook para calcular precio de oferta
productoSchema.pre('save', function(next) {
  if (this.enOferta && this.porcentajeDescuento > 0) {
    this.precioOferta = this.precio * (1 - this.porcentajeDescuento / 100);
  } else {
    this.precioOferta = this.precio;
  }
  next();
});

const Producto = mongoose.model('Producto', productoSchema);
export default Producto;

