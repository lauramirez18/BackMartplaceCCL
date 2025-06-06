import mongoose from "mongoose";

const categoriaSchema = new mongoose.Schema({
  codigo: { 
    type: String, 
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  name: { type: String, required: true },
  img: { type: String },
  description: { type: String, required: true },
  state: { type: String, default: '1' },
  especificaciones: {
    type: Object,
    default: {}
  },
  esPredefinida: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

export default mongoose.model('Categoria', categoriaSchema);