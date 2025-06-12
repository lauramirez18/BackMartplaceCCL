import mongoose from "mongoose";

const marcaSchema = new mongoose.Schema({
  nombre: { 
    type: String, 
    required: true,
    unique: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  logo: { 
    type: String,
    required: true 
  },
  state: { 
    type: String, 
    enum: ['1', '0'],
    default: '1' 
  }
}, { 
  timestamps: true,
  versionKey: false
});

// Create a unique index for slug
marcaSchema.index({ slug: 1 }, { unique: true });

// Add slug to text search index
marcaSchema.index({ nombre: 'text', slug: 'text' }, { name: 'marca_search_index' });

// Generate slug before saving
marcaSchema.pre('save', function(next) {
  // Solo generar slug si es nuevo o el nombre ha cambiado
  if (this.isModified('nombre') || !this.slug) {
    try {
      // Ensure nombre is a string and trim it
      const nombreStr = String(this.nombre).trim();
      
      if (!nombreStr) {
        throw new Error('El nombre de la marca no puede estar vacío');
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
        baseSlug = 'marca-' + Date.now();
      }

      this.slug = baseSlug;
    } catch (error) {
      next(error);
      return;
    }
  }
  next();
});

// Add a static method to find by slug
marcaSchema.statics.findBySlug = async function(slug) {
  if (!slug) {
    throw new Error('Slug de marca inválido');
  }
  
  const marca = await this.findOne({ slug: slug.toLowerCase() });
  if (!marca) {
    throw new Error('Marca no encontrada');
  }
  
  return marca;
};

export default mongoose.model('Marca', marcaSchema);