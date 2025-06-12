import mongoose from 'mongoose';

const usuarioSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    photoUrl: {
        type: String,
        default: null
    },
    phone: {
        type: String,
        default: null
    },
    address: {
        type: String,
        default: null
    },
    country: {
        type: String,
        default: null
    },
    state: {
        type: String,
        default: null
    },
    city: {
        type: String,
        default: null
    },
    preferences: {
        language: {
            type: String,
            enum: ['es', 'en'],
            default: 'es'
        },
        theme: {
            type: String,
            enum: ['light', 'dark'],
            default: 'light'
        },
        notifications: {
            type: Boolean,
            default: true
        },
        newsletter: {
            type: Boolean,
            default: true
        }
    },
    favoritos: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Producto'
    }],
    role: {
        type: String,
        required: true,
        default: 'user' // user, admin
    },
    estado: { 
        type: Boolean,
        default: true 
    }
}, {
    timestamps: true
});

export default mongoose.model('Usuario', usuarioSchema);

   