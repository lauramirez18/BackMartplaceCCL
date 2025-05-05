// routes/auth.js
import express from 'express';
import { verifyGoogleToken } from '../utils/google.js';
import jwt from 'jsonwebtoken';
import User from '../models/usuarios.js';

const router = express.Router();

router.post('/google', async (req, res) => {
  try {
    const { token } = req.body;
    
    // 1. Verificar el token con Google
    const googleUser = await verifyGoogleToken(token);
    
    // 2. Buscar o crear el usuario en tu base de datos
    let user = await User.findOne({ email: googleUser.email });
    
    if (!user) {
      // Crear nuevo usuario si no existe
      user = new User({
        name: googleUser.name,
        email: googleUser.email,
        googleId: googleUser.googleId,
        avatar: googleUser.picture,
        isVerified: true
      });
      await user.save();
    }
    
    // 3. Generar token JWT para tu aplicación
    const appToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    // 4. Enviar respuesta al cliente
    res.json({
      success: true,
      token: appToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar
      }
    });
    
  } catch (error) {
    console.error('Error en autenticación con Google:', error);
    res.status(401).json({
      success: false,
      message: 'Autenticación fallida'
    });
  }
});

export default router;