import mongoose from 'mongoose'

const productosSchema = new mongoose.Schema({
    name: {type: String, required: true},
    description: {type: String, required: true},
    price: {type: Number, required: true},
    category: {type: String, required: true},
    stock: {type: Number, required: true},
    img: {type: String, required: true},
    state: {type:String, default: '1'},
   
},

{
    timestamps:true
  })

export default mongoose.model('Productos', productosSchema)