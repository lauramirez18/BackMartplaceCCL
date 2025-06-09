import jwt from 'jsonwebtoken';
import User from '../models/usuarios.js';

export const validarJWT = async (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ error: 'No hay token en la petición' });
    }

    try {
        const { uid } = jwt.verify(token, process.env.JWT_SECRET);
        
        // Buscar usuario
        const usuario = await User.findById(uid);
        
        if (!usuario) {
            return res.status(401).json({ error: 'Token no válido - usuario no existe' });
        }

        // Verificar si el usuario está activo
        if (!usuario.estado) {
            return res.status(401).json({ error: 'Token no válido - usuario inactivo' });
        }

        req.usuario = usuario;
        next();
    } catch (error) {
        console.log(error);
        res.status(401).json({ error: 'Token no válido' });
    }
};

// Exportar también como auth para mantener compatibilidad
export const auth = validarJWT; 