import mongoose from "mongoose";

const marcaSchema = new mongoose.Schema({
  nombre: { 
    type: String, 
    required: true,
    unique: true,
    trim: true
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

export default mongoose.model('Marca', marcaSchema);