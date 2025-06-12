import User from '../models/usuarios.js';
import mongoose from 'mongoose';
import { generarJWT } from '../middleware/validar-jwt.js';
import bcrypt from 'bcryptjs';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
});

const httpUsers = {
    postRegistrarUsuario: async (req, res) => {
        try {
            const { name, email, password } = req.body;
            
            // Validar datos requeridos
            if (!name || !email || !password) {
                return res.status(400).json({ 
                    error: 'Faltan datos requeridos',
                    required: ['name', 'email', 'password']
                });
            }

            // Validar formato de email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({ error: 'Formato de email inválido' });
            }

            // Validar longitud de contraseña
            if (password.length < 6) {
                return res.status(400).json({ 
                    error: 'La contraseña debe tener al menos 6 caracteres' 
                });
            }

            const existinguser = await User.findOne({ email });
            if (existinguser) {
                return res.status(400).json({ error: 'El email ya está registrado' });
            }

            const hash = await bcrypt.hash(password, 10);
            const NuevoUsuario = new User({ 
                name, 
                email, 
                password: hash,
                role: 'user',
                favoritos: [],
                preferences: {
                    language: 'es',
                    theme: 'light',
                    notifications: true,
                    newsletter: true
                }
            });
            await NuevoUsuario.save();

            // Generar token JWT
            const token = await generarJWT(NuevoUsuario);

            res.status(201).json({ 
                message: 'Usuario registrado con éxito',
                token,
                user: {
                    id: NuevoUsuario._id,
                    name: NuevoUsuario.name,
                    email: NuevoUsuario.email,
                    role: NuevoUsuario.role,
                    profileCompleted: false
                }
            });
        } catch (error) {
            console.error('Error al registrar usuario:', error);
            return res.status(500).json({ error: 'Error al registrar usuario' });
        }
    },

    postLogin: async (req, res) => {
        try {
            const { email, password } = req.body;
            const user = await User.findOne({ email }).populate('favoritos');
            
            if (!user) {
                return res.status(400).json({ error: 'Usuario no encontrado' });
            }

            const passwordCorrecto = await bcrypt.compare(password, user.password);
            if (!passwordCorrecto) {
                return res.status(400).json({ error: 'Contraseña incorrecta' });
            }

            const token = await generarJWT(user);

            // Verificar si el perfil está completo
            const profileCompleted = Boolean(
                user.phone && 
                user.address && 
                user.countryId && 
                user.stateId && 
                user.cityId
            );

            res.status(200).json({ 
                token,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    photoUrl: user.photoUrl,
                    preferences: user.preferences,
                    favoritos: user.favoritos || [],
                    profileCompleted
                }
            });
        } catch (error) {
            console.error('Error al autenticar usuario:', error);
            return res.status(500).json({ error: 'Error al autenticar usuario' });
        }
    },

    checkProfileStatus: async (req, res) => {
        try {
            const user = await User.findById(req.usuario._id);
            
            const profileCompleted = Boolean(
                user.phone && 
                user.address && 
                user.countryId && 
                user.stateId && 
                user.cityId
            );

            res.json({
                profileCompleted,
                missingFields: {
                    phone: !user.phone,
                    address: !user.address,
                    country: !user.countryId,
                    state: !user.stateId,
                    city: !user.cityId
                }
            });
        } catch (error) {
            console.error('Error al verificar estado del perfil:', error);
            res.status(500).json({ error: 'Error al verificar estado del perfil' });
        }
    },

    getlistUser: async (req, res) => {
        try {
            const users = await User.find().select('-password');
            res.status(200).json(users);
        } catch (error) {
            console.error('Error al obtener usuarios:', error);
            res.status(500).json({ error: 'Error al obtener los usuarios' });
        }
    },

    putModifyUser: async (req, res) => {
        try {
            const { id } = req.params;
            const { name, email, password, role } = req.body;
            
            // Si se proporciona una nueva contraseña, hashearla
            let update = { name, email, role };
            if (password) {
                const hash = await bcrypt.hash(password, 10);
                update.password = hash;
            }

            const userModify = await User.findByIdAndUpdate(
                id, 
                update, 
                { new: true }
            ).select('-password');

            if (!userModify) {
                return res.status(404).json({ error: 'Usuario no encontrado' });
            }

            res.json(userModify);
        } catch (error) {
            console.error('Error al actualizar usuario:', error);
            res.status(500).json({ error: 'error al Actualizar usuario' });
        }
    },

    addToFavorites: async (req, res) => {
        try {
            const { productId } = req.params;
            const userId = req.usuario._id;
            
            if (!mongoose.Types.ObjectId.isValid(productId)) {
                return res.status(400).json({ error: 'ID de producto inválido' });
            }
            
            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({ error: 'Usuario no encontrado' });
            }
            
            if (!user.favoritos) {
                user.favoritos = [];
            }
            
            if (user.favoritos.includes(productId)) {
                return res.status(400).json({ message: 'El producto ya está en favoritos' });
            }
            
            user.favoritos.push(productId);
            await user.save();
            
            const updatedUser = await User.findById(userId).populate('favoritos');
            
            res.status(200).json({ 
                message: 'Producto añadido a favoritos', 
                favoritos: updatedUser.favoritos 
            });
        } catch (error) {
            console.error('Error al añadir a favoritos:', error);
            return res.status(500).json({ error: 'Error al añadir a favoritos' });
        }
    },

    removeFromFavorites: async (req, res) => {
        try {
            const { productId } = req.params;
            const userId = req.usuario._id;
            
            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({ error: 'Usuario no encontrado' });
            }
            
            if (!user.favoritos || !user.favoritos.includes(productId)) {
                return res.status(400).json({ message: 'El producto no está en favoritos' });
            }
            
            user.favoritos = user.favoritos.filter(id => id.toString() !== productId);
            await user.save();
            
            const updatedUser = await User.findById(userId).populate('favoritos');
            
            res.status(200).json({ 
                message: 'Producto eliminado de favoritos', 
                favoritos: updatedUser.favoritos 
            });
        } catch (error) {
            console.error('Error al eliminar de favoritos:', error);
            return res.status(500).json({ error: 'Error al eliminar de favoritos' });
        }
    },

    getFavorites: async (req, res) => {
        try {
            const userId = req.usuario._id;
            
            const user = await User.findById(userId).populate('favoritos');
            if (!user) {
                return res.status(404).json({ error: 'Usuario no encontrado' });
            }
            
            res.status(200).json({ favoritos: user.favoritos || [] });
        } catch (error) {
            console.error('Error al obtener favoritos:', error);
            return res.status(500).json({ error: 'Error al obtener favoritos' });
        }
    },

    getProfile: async (req, res) => {
        try {
            console.log('Iniciando getProfile');
            console.log('Usuario en request:', req.usuario);

            if (!req.usuario || !req.usuario._id) {
                console.log('No hay usuario en request');
                return res.status(401).json({ error: 'No autorizado - Usuario no identificado' });
            }

            const user = await User.findById(req.usuario._id)
                .select('-password')
                .populate({
                    path: 'favoritos',
                    select: 'name price imageUrl'
                });

            console.log('Usuario encontrado:', user);

            if (!user) {
                console.log('Usuario no encontrado en BD');
                return res.status(404).json({ error: 'Usuario no encontrado' });
            }

            // Convertir el documento a un objeto plano
            const userObject = user.toObject();

            // Asegurarse de que todos los campos necesarios existan
            const defaultUserData = {
                name: '',
                email: '',
                phone: '',
                address: '',
                country: '',
                state: '',
                city: '',
                photoUrl: null,
                favoritos: [],
                preferences: {
                    language: 'es',
                    theme: 'light',
                    notifications: true,
                    newsletter: true
                }
            };

            // Combinar los datos del usuario con los valores por defecto
            const userData = {
                ...defaultUserData,
                ...userObject,
                preferences: {
                    ...defaultUserData.preferences,
                    ...(userObject.preferences || {})
                }
            };

            // Asegurarse de que favoritos sea un array
            if (!Array.isArray(userData.favoritos)) {
                userData.favoritos = [];
            }

            // Verificar si el perfil está completo
            const profileCompleted = Boolean(
                userData.phone && 
                userData.address && 
                userData.country && 
                userData.state && 
                userData.city
            );

            console.log('Enviando respuesta con datos del usuario:', userData);
            res.json({
                ...userData,
                profileCompleted
            });
        } catch (error) {
            console.error('Error detallado en getProfile:', error);
            res.status(500).json({ 
                error: 'Error al obtener el perfil',
                details: error.message 
            });
        }
    },

    updateProfile: async (req, res) => {
        try {
            const {
                name,
                email,
                phone,
                address,
                country,
                state,
                city,
                preferences
            } = req.body;

            // Verificar si el email ya existe para otro usuario
            if (email) {
                const existingUser = await User.findOne({ email, _id: { $ne: req.usuario._id } });
                if (existingUser) {
                    return res.status(400).json({ error: 'El email ya está en uso' });
                }
            }

            const updateData = {
                name,
                email,
                phone,
                address,
                country,
                state,
                city,
                preferences
            };

            // Eliminar campos undefined o null
            Object.keys(updateData).forEach(key => 
                updateData[key] === undefined || updateData[key] === null && delete updateData[key]
            );

            const updatedUser = await User.findByIdAndUpdate(
                req.usuario._id,
                updateData,
                { new: true }
            ).select('-password');

            res.json(updatedUser);
        } catch (error) {
            console.error('Error al actualizar perfil:', error);
            res.status(500).json({ error: 'Error al actualizar el perfil' });
        }
    },

    uploadPhoto: async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({ error: 'No se ha subido ninguna imagen' });
            }

            // Subir imagen a Cloudinary
            const result = await cloudinary.uploader.upload(req.file.path, {
                folder: 'user_photos',
                width: 300,
                crop: "scale"
            });

            // Actualizar URL de la foto en el usuario
            const updatedUser = await User.findByIdAndUpdate(
                req.usuario._id,
                { photoUrl: result.secure_url },
                { new: true }
            ).select('-password');

            res.json(updatedUser);
        } catch (error) {
            console.error('Error al subir foto:', error);
            res.status(500).json({ error: 'Error al subir la foto' });
        }
    },

    changePassword: async (req, res) => {
        try {
            const { currentPassword, newPassword } = req.body;
            const user = await User.findById(req.usuario._id);

            // Verificar contraseña actual
            const passwordCorrecto = await bcrypt.compare(currentPassword, user.password);
            if (!passwordCorrecto) {
                return res.status(400).json({ error: 'Contraseña actual incorrecta' });
            }

            // Hashear nueva contraseña
            const hash = await bcrypt.hash(newPassword, 10);

            // Actualizar contraseña
            user.password = hash;
            await user.save();

            res.json({ message: 'Contraseña actualizada correctamente' });
        } catch (error) {
            console.error('Error al cambiar contraseña:', error);
            res.status(500).json({ error: 'Error al cambiar la contraseña' });
        }
    },

    deleteAccount: async (req, res) => {
        try {
            await User.findByIdAndUpdate(req.usuario._id, { estado: false });
            res.json({ message: 'Cuenta eliminada correctamente' });
        } catch (error) {
            console.error('Error al eliminar cuenta:', error);
            res.status(500).json({ error: 'Error al eliminar la cuenta' });
        }
    }
};

export default httpUsers;




