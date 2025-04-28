import express from 'express';
import upload from '../middleware/upploads.js'; 

const router = express.Router();

// Ruta para subir imágenes
router.post('/', upload.single('image'), async (req, res) => {
  try {
    // req.file tendrá la info de la imagen subida
    res.json({
      message: '✅ Imagen subida correctamente',
      url: req.file.path,     // URL pública de la imagen
      filename: req.file.filename, // Nombre de la imagen
    });
  } catch (error) {
    console.error('Error subiendo imagen:', error);
    res.status(500).json({ message: '❌ Error al subir imagen' });
  }
});

export default router;
