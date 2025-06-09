import express from 'express';
import { 
    getProfile, 
    updateProfile, 
    uploadPhoto, 
    changePassword, 
    deleteAccount 
} from '../controllers/usuarios.js';
import { validarJWT } from '../middleware/auth.js';
import { handleFileUpload } from '../middleware/fileUpload.js';

const router = express.Router();

// Get user profile
router.get('/profile', validarJWT, getProfile);

// Update user profile
router.put('/update-profile', validarJWT, updateProfile);

// Upload profile photo
router.post('/upload-photo', validarJWT, handleFileUpload, uploadPhoto);

// Change password
router.put('/change-password', validarJWT, changePassword);

// Delete account
router.post('/delete-account', validarJWT, deleteAccount);

export default router; 