// server/models/productos.js

import mongoose from 'mongoose';

const productoSchema = new mongoose.Schema(
  {
  
    nombre: { type: String, required: true, trim: true },
    descripcion: { type: String, required: true },
    imagenes: [{ type: String, required: true }],
    state: { type: String, enum: ['1', '0'], default: '1' }, 
  
    precio: { type: Number, required: true, min: 0 },
    enOferta: { type: Boolean, default: false },
    porcentajeDescuento: { type: Number, min: 0, max: 100, default: 0 },
    precioOferta: { 
      type: Number,
      min: 0,
      default: function() {
        return this.enOferta ? this.precio * (1 - this.porcentajeDescuento / 100) : this.precio;
      }
    },
    fechaInicioOferta: { type: Date, default: null },
    fechaFinOferta: { type: Date, default: null },

  
    marca: { type: mongoose.Schema.Types.ObjectId, ref: 'Marca', required: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Categoria', required: true }, // Consistencia con 'category' vs 'categoria' es clave
    subcategory: { type: mongoose.Schema.Types.ObjectId, ref: 'Subcategoria', required: true }, // Consistencia con 'subcategory' vs 'subcategoria' es clave
    especificaciones: { type: Object, required: true, default: {} }, // Considera 'Map' si las claves son dinámicas

   
    stock: { type: Number, required: true, min: 0 },
    promedioCalificacion: { type: Number, default: 0 }, 
    totalResenas: { type: Number, default: 0 },           
  },
  {
   
    timestamps: { createdAt: true, updatedAt: false }, 
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// --- Índices para Búsqueda ---
productoSchema.index(
  {
    nombre: 'text',
    descripcion: 'text',
    'especificaciones.tipo': 'text' // Asegúrate de que 'tipo' realmente exista en tus especificaciones si lo usas
  },
  { name: 'product_search_index' }
);

// --- Virtuales (Campos calculados o derivados, no almacenados en DB) ---
productoSchema.virtual('imagenPrincipal').get(function () {
  return this.imagenes.length > 0 ? this.imagenes[0] : null;
});

productoSchema.virtual('ofertaActiva').get(function() {
  if (!this.enOferta) return false;
  
  const now = new Date();
  const inicioValido = !this.fechaInicioOferta || now >= this.fechaInicioOferta;
  const finValido = !this.fechaFinOferta || now <= this.fechaFinOferta;
  
  return inicioValido && finValido;
});

// --- Hooks de Mongoose (Lógica antes/después de operaciones) ---
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