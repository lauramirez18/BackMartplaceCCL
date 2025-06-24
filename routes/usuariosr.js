import { Router } from 'express';
import httpUsers from '../controllers/usuarioc.js';
import { validarJWT } from '../middleware/auth.js';
import upload from '../middleware/upploads.js';
import { cleanUploads } from '../middleware/upploads.js';

const router = Router();

// Rutas públicas
router.post('/registro', httpUsers.postRegistrarUsuario);
router.post('/login', httpUsers.postLogin);

// Rutas protegidas (requieren autenticación)
router.get('/profile', validarJWT, httpUsers.getProfile);
router.get('/profile-status', validarJWT, httpUsers.checkProfileStatus);
router.put('/update-profile', validarJWT, httpUsers.updateProfile);
router.post('/upload-photo', 
    validarJWT, 
    upload.single('photo'), 
    cleanUploads,
    httpUsers.uploadPhoto
);
router.put('/change-password', validarJWT, httpUsers.changePassword);
router.post('/delete-account', validarJWT, httpUsers.deleteAccount);

// Rutas de administración (solo admin)
router.get('/list', validarJWT, httpUsers.getlistUser);
router.put('/modify/:id', validarJWT, httpUsers.putModifyUser);

// Rutas de favoritos (protegidas)
router.get('/favoritos', validarJWT, httpUsers.getFavorites);
router.post('/favoritos/:productId', validarJWT, httpUsers.addToFavorites);
router.delete('/favoritos/:productId', validarJWT, httpUsers.removeFromFavorites);

export default router;