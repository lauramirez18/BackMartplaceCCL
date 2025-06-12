import mongoose from 'mongoose';

const productoSchema = new mongoose.Schema(
  {
  
    nombre: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
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
    'especificaciones.tipo': 'text',
    slug: 'text' // Add slug to text search
  },
  { name: 'product_search_index' }
);

// Create a unique index for slug
productoSchema.index({ slug: 1 }, { unique: true });

// --- Virtuales (Campos calculados o derivados, no almacenados en DB) ---
productoSchema.virtual('imagenPrincipal').get(function () {
  return Array.isArray(this.imagenes) && this.imagenes.length > 0 ? this.imagenes[0] : null;
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
  // Generate slug from nombre if it's new or nombre has changed
  if (this.isModified('nombre') || this.isNew) {
    try {
      // Ensure nombre is a string and trim it
      const nombreStr = String(this.nombre).trim();
      
      if (!nombreStr) {
        throw new Error('El nombre del producto no puede estar vacío');
      }

      // Generate base slug
      let baseSlug = nombreStr
        .toLowerCase()
        .normalize('NFD') // Normalize to decomposed form
        .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
        .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
        .replace(/(^-|-$)/g, ''); // Remove leading/trailing hyphens

      // If slug is empty after processing, use a fallback
      if (!baseSlug) {
        baseSlug = 'producto-' + Date.now();
      }

      // Ensure slug is unique by appending a timestamp if needed
      this.slug = baseSlug;
    } catch (error) {
      next(error);
      return;
    }
  }

  // Calculate precioOferta
  if (this.enOferta && this.porcentajeDescuento > 0) {
    this.precioOferta = this.precio * (1 - this.porcentajeDescuento / 100);
  } else {
    this.precioOferta = this.precio;
  }
  next();
});

// Add a static method to find by slug
productoSchema.statics.findBySlug = async function(slug) {
  if (!slug) {
    throw new Error('Slug de producto inválido');
  }
  
  const producto = await this.findOne({ slug: slug.toLowerCase() });
  if (!producto) {
    throw new Error('Producto no encontrado');
  }
  
  return producto;
};

const Producto = mongoose.model('Producto', productoSchema);
export default Producto;