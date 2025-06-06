import { Router } from 'express';
import httpUsers from '../controllers/usuarioc.js';
import { validarJWT } from '../middleware/auth.js';

const router = Router();

// Rutas públicas
router.post('/registro', httpUsers.postRegistrarUsuario);
router.post('/login', httpUsers.postLogin);

// Rutas protegidas
router.get('/', validarJWT, httpUsers.getlistUser);
router.put('/:id', validarJWT, httpUsers.putModifyUser);

// Rutas de favoritos (protegidas)
router.get('/favoritos', validarJWT, httpUsers.getFavorites);
router.post('/favoritos/:productId', validarJWT, httpUsers.addToFavorites);
router.delete('/favoritos/:productId', validarJWT, httpUsers.removeFromFavorites);

export default router;