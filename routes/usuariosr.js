import express from 'express';
import httpUsers from '../controllers/usuarioc.js';
import { validarJWT } from '../middleware/auth.js';
import { handleFileUpload } from '../middleware/fileUpload.js';

const router = express.Router();

// Register user
router.post('/register', httpUsers.postRegistrarUsuario);

// Login user
router.post('/login', httpUsers.postLogin);

// Get user list
router.get('/', httpUsers.getlistUser);

// Modify user by id
router.put('/:id', httpUsers.putModifyUser);

// Favorites
router.post('/favorites/add', httpUsers.addToFavorites);
router.post('/favorites/remove', httpUsers.removeFromFavorites);
router.get('/favorites/:userId', httpUsers.getFavorites);

// Profile
router.get('/profile', validarJWT, httpUsers.getProfile);
router.put('/update-profile', validarJWT, httpUsers.updateProfile);

// Upload profile photo
router.post('/upload-photo', validarJWT, handleFileUpload, httpUsers.uploadPhoto);

// Change password
router.put('/change-password', validarJWT, httpUsers.changePassword);

// Delete account
router.post('/delete-account', validarJWT, httpUsers.deleteAccount);

export default router;