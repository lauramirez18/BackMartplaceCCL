import fileUpload from 'express-fileupload';

export const fileUploadMiddleware = fileUpload({
    useTempFiles: true,
    tempFileDir: '/tmp/',
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max file size
    abortOnLimit: true,
    responseOnLimit: 'El tamaño del archivo excede el límite permitido'
});

export const handleFileUpload = (req, res, next) => {
    fileUploadMiddleware(req, res, (err) => {
        if (err) {
            return res.status(400).json({ msg: err.message });
        }
        next();
    });
}; 