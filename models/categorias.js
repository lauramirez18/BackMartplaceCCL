import mongoose from "mongoose";

const categoriaSchema = new mongoose.Schema({
  codigo: { 
    type: String, 
    required: true,
    unique: true,
    enum: [
      'portatiles',     // 1
      'pcEscritorio',  // 2
      'celulares',      // 3
      'smartwatch',     // 4
      'pantallas',      // 5
      'audifonos',      // 6
      'tablets',        // 7
      'mouse',          // 8
      'teclado',        // 9
      'componentes'     // 10
    ],
  },
  name: { type: String, required: true },
  slug: { type: String, unique: true },
  img: { type: String },
  description: { type: String, required: true },
  state: { type: String, default: '1' }, 
}, { timestamps: true });

export default mongoose.model('Categoria', categoriaSchema);