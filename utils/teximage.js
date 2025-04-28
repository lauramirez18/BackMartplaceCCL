import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv'
dotenv.config();
(async function() {
    cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    try {
        const uploadResult = await cloudinary.uploader.upload(
            'https://res.cloudinary.com/demo/image/upload/getting-started/shoes.jpg',
            {
                public_id: 'shoes',
            }
        );
        
        console.log('Imagen subida:', uploadResult.secure_url);
    } catch (error) {
        console.error('Error subiendo imagen:', error);
    }
})();

export default cloudinary;