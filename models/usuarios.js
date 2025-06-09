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
    phone: {
        type: String
    },
    address: {
        type: String
    },
    city: {
        type: String
    },
    photoUrl: {
        type: String
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
    password: {
        type: String,
        required: true
    },
    estado: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

export default mongoose.model('Usuario', usuarioSchema);

   