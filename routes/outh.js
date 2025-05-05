// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const {
  verifyGoogleToken,
  getTokensFromCode,
  getUserData,
  getAuthUrl
} = require('../utils/google.js');

// Ruta para iniciar el flujo OAuth
router.get('/google', (req, res) => {
  const authUrl = getAuthUrl();
  res.redirect(authUrl);
});

// Ruta de callback para Google OAuth
router.get('/google/callback', async (req, res, next) => {
  try {
    const { code } = req.query;
    
    if (!code) {
      return res.status(400).json({ error: 'Código de autorización faltante' });
    }
    
    // 1. Obtener tokens usando el código
    const tokens = await getTokensFromCode(code);
    
    // 2. Verificar el token ID
    const tokenInfo = await verifyGoogleToken(tokens.id_token);
    
    // 3. Obtener datos adicionales del perfil
    const userData = await getUserData(tokens.access_token);
    
    // 4. Combinar información del usuario
    const user = {
      ...tokenInfo,
      ...userData,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token
    };
    
    // 5. Aquí deberías buscar/crear el usuario en tu base de datos
    // const dbUser = await findOrCreateUser(user);
    
    // 6. Crear sesión o token JWT para tu aplicación
    // const appToken = generateAppToken(dbUser);
    
    // 7. Redirigir al frontend con los tokens
    res.redirect(`/auth/success?token=${tokens.id_token}`);
    
  } catch (error) {
    console.error('Error en Google OAuth callback:', error);
    res.redirect('/auth/error?message=Error en autenticación Google');
  }
});

// Ruta para autenticación directa con token ID (para mobile/flutter)
router.post('/google/token', async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ error: 'Token faltante' });
    }
    
    // Verificar el token
    const userInfo = await verifyGoogleToken(token);
    
    // Buscar/crear usuario en tu base de datos
    // const user = await findOrCreateUser(userInfo);
    
    // Generar token JWT para tu aplicación
    // const appToken = generateAppToken(user);
    
    res.json({
      success: true,
      user: userInfo,
      // token: appToken
    });
    
  } catch (error) {
    console.error('Error en autenticación con token Google:', error);
    res.status(401).json({ error: 'Token de Google inválido' });
  }
});

module.exports = router;