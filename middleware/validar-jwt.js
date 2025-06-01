import jwt from 'jsonwebtoken';
import User from '../models/usuarios.js';  
import mongoose from 'mongoose'; 

export const generarJWT = (usuario) => {
    return new Promise((resolve, reject) => {
        const payload = {
            uid: usuario._id,
            name: usuario.name,
            email: usuario.email,
            role: usuario.role
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            {
                expiresIn: '24h'
            },
            (err, token) => {
                if (err) {
                    console.error('Error al generar token:', err);
                    reject('No se pudo generar el token');
                } else {
                    resolve(token);
                }
            }
        );
    });
};

export const validarJWT = async (req, res, next) => {
    const token = req.header('x-token') || req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({
            error: 'No hay token en la petición'
        });
    }

    try {
        // Verificar token
        const { uid } = jwt.verify(token, process.env.JWT_SECRET);

        // Leer el usuario
        const usuario = await User.findById(uid);

        if (!usuario) {
            return res.status(401).json({
                error: 'Token no válido - usuario no existe'
            });
        }

        // Verificar si el usuario está activo
        if (!usuario.estado) {
            return res.status(401).json({
                error: 'Token no válido - usuario inactivo'
            });
        }

        // Agregar usuario al request
        req.usuario = usuario;
        next();

    } catch (error) {
        console.error('Error en validación de token:', error);
        return res.status(401).json({
            error: 'Token no válido'
        });
    }
};