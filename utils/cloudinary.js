import { v2 as cloudinary } from 'cloudinary';
import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } from '../config.js';

cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET
});

export const uploadToCloudinary = async (filePath) => {
    try {
        const result = await cloudinary.uploader.upload(filePath, {
            folder: 'profile_photos',
            resource_type: 'image'
        });
        return result;
    } catch (error) {
        console.error('Error uploading to Cloudinary:', error);
        throw new Error('Error al subir la imagen');
    }
}; 