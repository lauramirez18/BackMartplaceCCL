import mongoose from 'mongoose';

const usuarioSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    role:{
        type: String,
        required: true,
        default: 'user' // user, admin
    },  
    password: {
        type: String,
        required: true
    },
      estado: { 
        type: Boolean,
        default: true 
    }
},
{
    timestamps: true
});

export default mongoose.model('Usuario', usuarioSchema);

   