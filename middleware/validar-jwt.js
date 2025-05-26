
import jwt from 'jsonwebtoken';
import User from '../models/usuarios.js'; 

const validarJWT = async (req, res, next) => {
    const token = req.header('x-token');

    if (!token) {
        return res.status(401).json({
            msg: 'No hay token en la petición'
        });
    }

    try {
        const { uid } = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(uid);

        if (!user) {
            return res.status(401).json({
                msg: 'Token no válido - usuario no existe en DB'
            });
        }

        
        if (!user.estado) { 
            return res.status(401).json({
                msg: 'Token no válido - usuario con estado: false'
            });
        }

        req.user = user; 
        next();

    } catch (error) {
        console.log(error);
        res.status(401).json({
            msg: 'Token no válido'
        });
    }
};


const generarJWT = (user) => {
    return new Promise((resolve, reject) => {
        const payload = { uid: user.id };
        jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: '12h' 
        }, (err, token) => {
            if (err) {
                console.log(err);
                reject('No se pudo generar el token');
            } else {
                resolve(token);
            }
        });
    });
};

export {
    validarJWT,
    generarJWT
};