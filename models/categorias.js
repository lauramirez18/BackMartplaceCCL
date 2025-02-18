import mongoose from "mongoose";

const CategoriasSchema = new mongoose.Schema({
  name: { type: String, required: true },
    description: { type: String, required: true },
    state: { type: String, default: '1' },
},
{
    timestamps: true 
});

export default mongoose.model('Categorias', CategoriasSchema);
