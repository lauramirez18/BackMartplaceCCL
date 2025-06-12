import jwt from 'jsonwebtoken';
import User from '../models/usuarios.js';

export const validarJWT = async (req, res, next) => {
    try {
        console.log('Iniciando validación de token');
        console.log('Headers completos:', req.headers);

        // Intentar obtener el token de diferentes headers
        const authHeader = req.header('Authorization');
        const xTokenHeader = req.header('x-token');
        
        console.log('Auth Header:', authHeader);
        console.log('X-Token Header:', xTokenHeader);

        let token = null;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.replace('Bearer ', '');
        } else if (xTokenHeader) {
            token = xTokenHeader;
        }

        console.log('Token extraído:', token);

        if (!token) {
            console.log('No se encontró token en los headers');
            return res.status(401).json({ error: 'No hay token en la petición' });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log('Token decodificado:', decoded);
            
            if (!decoded.uid) {
                console.log('Token no contiene uid');
                return res.status(401).json({ error: 'Token inválido - ID de usuario no encontrado' });
            }

            // Buscar usuario
            const usuario = await User.findById(decoded.uid);
            console.log('Usuario encontrado:', usuario ? 'Sí' : 'No');
            
            if (!usuario) {
                console.log('Usuario no encontrado en la base de datos');
                return res.status(401).json({ error: 'Token no válido - usuario no existe' });
            }

            // Verificar si el usuario está activo
            if (!usuario.estado) {
                console.log('Usuario inactivo');
                return res.status(401).json({ error: 'Token no válido - usuario inactivo' });
            }

            // Añadir usuario a la request
            req.usuario = usuario;
            console.log('Usuario añadido a request');
            next();
        } catch (jwtError) {
            console.error('Error al verificar token:', jwtError);
            if (jwtError.name === 'JsonWebTokenError') {
                return res.status(401).json({ error: 'Token no válido' });
            }
            if (jwtError.name === 'TokenExpiredError') {
                return res.status(401).json({ error: 'Token expirado' });
            }
            throw jwtError;
        }
    } catch (error) {
        console.error('Error en validación de token:', error);
        res.status(500).json({ 
            error: 'Error en la autenticación',
            details: error.message 
        });
    }
}; 