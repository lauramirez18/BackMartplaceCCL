import jwt from 'jsonwebtoken';
import usurios from '../models/usuario.js';

const generarJWT = (id) => {
    return new Promise((resolve, reject) => {
        const payload = {id};
        jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: '48h'
            }, (err, token) => {
                if (err) {
                    reject(err);
                }
                resolve(token);
            });
    });

 };

 const validarJWT = async (req, res, next) => {
    const token = req.header('x-token');
    if (!token) {
        return res.status(401).json({ message: 'No se ha Porporcionado el token' });
    }
    try {
        const {id} = jwt.verify(token, process.env.JWT_SECRET);
        const user = await usurios.findById(id);
        if (!user) {
            return res.status(401).json({ error: 'token no valido: usuario no encontrado'});
        }
        if (user.estado === 0) {
            return res.status(401).json({ error: 'cuenta inactiva' });
        }
        next();
        
    } catch (error) {
        return res.status(401).json({ error: 'token no valido' });
    }
        
    };

    export {validarJWT, generarJWT};