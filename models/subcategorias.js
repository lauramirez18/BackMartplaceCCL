import mongoose from 'mongoose';

const subcategoriaSchema = new mongoose.Schema({
  codigo: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  name: {
    type: String,
    required: true
  },
  categoriaPadre: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  state: {
    type: String,
    enum: ['1', '0'],
    default: '1'
  }
}, { timestamps: true, versionKey: false });

export default mongoose.model('Subcategoria', subcategoriaSchema);