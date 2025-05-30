import { Router } from 'express';
import httpUsers from '../controllers/usuarioc.js';

const router = Router();

router.post('/registro', [

], httpUsers.postRegistrarUsuario);

router.post('/login', [

], httpUsers.postLogin)

router.get('/users', [
 
], httpUsers.getlistUser)

router.put('/users/:id', [

], httpUsers.putModifyUser)

// Favorites routes
router.post('/users/:userId/favorites/:productId', httpUsers.addToFavorites);
router.delete('/users/:userId/favorites/:productId', httpUsers.removeFromFavorites);
router.get('/users/:userId/favorites', httpUsers.getFavorites);

export default router

