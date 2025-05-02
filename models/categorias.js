import mongoose from "mongoose";

const categoriasSchema = new mongoose.Schema({
  name: { type: String, required: true },
  img: { type: String, required: true },
    description: { type: String, required: true },
    state: { type: String, default: '1' },
},
{
    timestamps: true 
});

export default mongoose.model('Categorias', categoriasSchema);
