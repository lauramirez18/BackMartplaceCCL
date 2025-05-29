import jwt from 'jsonwebtoken';
import User from '../models/usuarios.js';  
import mongoose from 'mongoose'; 

const validarJWT = async (req, res, next) => {
  console.log('=== VALIDANDO JWT ===');
  
  const authorization = req.headers.authorization;
  console.log('Authorization header:', authorization);
  
  if (!authorization?.startsWith('Bearer ')) {
    console.log('Formato de token inválido');
    return res.status(401).json({ error: "Formato de token inválido" });
  }

  const token = authorization.split(' ')[1];
  console.log('Token extraído:', token);
  console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);
  
  try {
    // Agregar más debug aquí
    console.log('Intentando verificar token...');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token decodificado completo:', decoded);
    
    const { uid } = decoded;
    console.log('UID decodificado:', uid);
    console.log('Tipo de UID:', typeof uid);
    
    // Verificar si es un ObjectId válido
    if (!mongoose.Types.ObjectId.isValid(uid)) {
      console.log('UID no es un ObjectId válido');
      return res.status(401).json({ error: "Token inválido" });
    }
    
    const usuario = await User.findById(uid);
    console.log('Usuario encontrado:', usuario ? 'Sí' : 'No');
    console.log('ID buscado:', uid);
    
    if (!usuario) {
      console.log('Usuario no existe en BD');
      return res.status(401).json({ error: "Usuario no existe" });
    }
    
    if (!usuario.estado) {
      console.log('Usuario desactivado');
      return res.status(401).json({ error: "Usuario desactivado" });
    }

    console.log('Usuario válido, continuando...');
    req.usuario = usuario;
    next();

  } catch (error) {
    console.error("Error JWT completo:", error);
    console.error("Error JWT mensaje:", error.message);
    console.error("Error JWT nombre:", error.name);
    
    const mensaje = error.name === 'TokenExpiredError' 
      ? "Token expirado"
      : "Token inválido";
    res.status(401).json({ error: mensaje });
  }
};
// En generarJWT
const generarJWT = (user) => {
  return new Promise((resolve, reject) => {
    const payload = { uid: user._id.toString() };
    
    // LOGS PARA DEBUG
    console.log('=== GENERANDO TOKEN ===');
    console.log('JWT_SECRET al generar (primeros 10 chars):', process.env.JWT_SECRET?.substring(0, 10));
    console.log('JWT_SECRET completo al generar:', process.env.JWT_SECRET);
    
    jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '12h'
    }, (err, token) => {
      if (err) {
        console.log('Error generando token:', err);
        reject('No se pudo generar el token');
      } else {
        console.log('Token generado exitosamente');
        console.log('Token completo:', token);
        resolve(token);
      }
    });
  });
};
export {
  validarJWT,
  generarJWT
};