import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

// Función para subir múltiples imágenes
export const uploadImages = async (files, folder = 'productos') => {
  try {
    const uploadPromises = files.map(file => 
      cloudinary.uploader.upload(file.path, { folder })
    );
    return await Promise.all(uploadPromises);
  } catch (error) {
    console.error('Error subiendo imágenes a Cloudinary:', error);
    throw error;
  }
};

// Función para eliminar imágenes
export const deleteImages = async (publicIds) => {
  try {
    const deletePromises = publicIds.map(publicId => 
      cloudinary.uploader.destroy(publicId)
    );
    return await Promise.all(deletePromises);
  } catch (error) {
    console.error('Error eliminando imágenes de Cloudinary:', error);
    throw error;
  }
};

export default cloudinary;