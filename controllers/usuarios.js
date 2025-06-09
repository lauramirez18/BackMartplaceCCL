import Usuario from '../models/usuarios.js';
import bcrypt from 'bcryptjs';
import { uploadToCloudinary } from '../utils/cloudinary.js';

// Get user profile
export const getProfile = async (req, res) => {
    try {
        const usuario = await Usuario.findById(req.usuario._id).select('-password');
        if (!usuario) {
            return res.status(404).json({ msg: 'Usuario no encontrado' });
        }
        res.json(usuario);
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Error al obtener el perfil' });
    }
};

// Update user profile
export const updateProfile = async (req, res) => {
    try {
        const { name, email, phone, address, city, preferences } = req.body;
        
        // Check if email is already taken by another user
        if (email) {
            const existingUser = await Usuario.findOne({ email, _id: { $ne: req.usuario._id } });
            if (existingUser) {
                return res.status(400).json({ msg: 'El correo electrónico ya está en uso' });
            }
        }

        const usuario = await Usuario.findById(req.usuario._id);
        if (!usuario) {
            return res.status(404).json({ msg: 'Usuario no encontrado' });
        }

        // Update fields
        if (name) usuario.name = name;
        if (email) usuario.email = email;
        if (phone) usuario.phone = phone;
        if (address) usuario.address = address;
        if (city) usuario.city = city;
        if (preferences) {
            usuario.preferences = {
                ...usuario.preferences,
                ...preferences
            };
        }

        await usuario.save();
        res.json({ msg: 'Perfil actualizado correctamente', usuario });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Error al actualizar el perfil' });
    }
};

// Upload profile photo
export const uploadPhoto = async (req, res) => {
    try {
        if (!req.files || !req.files.photo) {
            return res.status(400).json({ msg: 'No se ha proporcionado ninguna imagen' });
        }

        const result = await uploadToCloudinary(req.files.photo.tempFilePath);
        
        const usuario = await Usuario.findById(req.usuario._id);
        if (!usuario) {
            return res.status(404).json({ msg: 'Usuario no encontrado' });
        }

        usuario.photoUrl = result.secure_url;
        await usuario.save();

        res.json({ msg: 'Foto de perfil actualizada', photoUrl: result.secure_url });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Error al subir la foto de perfil' });
    }
};

// Change password
export const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        const usuario = await Usuario.findById(req.usuario._id);
        if (!usuario) {
            return res.status(404).json({ msg: 'Usuario no encontrado' });
        }

        // Verify current password
        const isMatch = await bcrypt.compare(currentPassword, usuario.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Contraseña actual incorrecta' });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        usuario.password = await bcrypt.hash(newPassword, salt);
        await usuario.save();

        res.json({ msg: 'Contraseña actualizada correctamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Error al cambiar la contraseña' });
    }
};

// Delete account
export const deleteAccount = async (req, res) => {
    try {
        const usuario = await Usuario.findById(req.usuario._id);
        if (!usuario) {
            return res.status(404).json({ msg: 'Usuario no encontrado' });
        }

        // Instead of actually deleting, we'll mark as inactive
        usuario.estado = false;
        await usuario.save();

        res.json({ msg: 'Cuenta eliminada correctamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Error al eliminar la cuenta' });
    }
}; 