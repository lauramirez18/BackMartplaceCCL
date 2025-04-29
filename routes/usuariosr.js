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

export default router
