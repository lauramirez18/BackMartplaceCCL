import axios from 'axios';
import cloudinary from '../utils/teximage.js'; 
import Productos from '../models/productos.js';
import { Readable } from 'stream';

// Función para subir imagen desde una URL
const uploadImageFromUrl = async (url) => {
  // Obtener la imagen como buffer
  const response = await axios({
    url,
    method: 'GET',
    responseType: 'arraybuffer',
  });

  const buffer = Buffer.from(response.data, 'binary');

  // Subir la imagen a Cloudinary
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: 'productos' }, 
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );

    Readable.from(buffer).pipe(uploadStream);
  });
};

// Crear un producto
export const createProducto = async (req, res) => {
    try {
        const { name, price, stock, img, description, category, state } = req.body;
        
        let cloudinaryImageUrl = img;

        if (img && img.startsWith('http')) {
            cloudinaryImageUrl = await uploadImageFromUrl(img);
            console.log("Imagen subida a Cloudinary: ", cloudinaryImageUrl);
        }

        if (price <= 0 || stock < 0) {
            return res.status(400).json({ message: 'Precio o stock inválido' });
        }

        const producto = new Productos({
            name,
            price,
            stock,
            description,
            img: cloudinaryImageUrl,
            category,
            state
        });
        
        await producto.save();
        res.status(201).json(producto);
    } catch (error) {
        console.error("Error al crear el producto:", error);
        res.status(500).json({ 
            message: 'Error al crear el producto', 
            error: error.message || error 
        });
    }
};

// Resto de tus funciones del controlador (getProductos, getProductoById, etc...)
export const getProductos = async (req, res) => {
    try {
        const productos = await Productos.find({ state: '1' });
        res.status(200).json(productos);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener los productos', error });
    }
};

// Obtener un producto por ID
export const getProductoById = async (req, res) => {
    try {
        const producto = await Productos.findById(req.params.id);
        if (!producto) {
            return res.status(404).json({ message: 'Producto no encontrado' });
        }
        res.status(200).json(producto);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener el producto', error });
    }
};

// Actualizar un producto
export const updateProducto = async (req, res) => {
    try {
        const updatedProducto = await Productos.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedProducto) {
            return res.status(404).json({ message: 'Producto no encontrado' });
        }
        res.status(200).json(updatedProducto);
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar el producto', error });
    }
};

// Activar/Inactivar producto
export const toggleProductoState = async (req, res) => {
    try {
        const producto = await Productos.findById(req.params.id);
        if (!producto) {
            return res.status(404).json({ message: 'Producto no encontrado' });
        }

        producto.state = producto.state === '1' ? '0' : '1';
        await producto.save();

        res.status(200).json({ 
            message: `Producto ${producto.state === '1' ? 'activado' : 'inactivado'}`,
            producto 
        });
    } catch (error) {
        res.status(500).json({ message: 'Error al cambiar el estado del producto', error });
    }
};

// Obtener productos por categoría
export const getProductosByCategory = async (req, res) => {
    try {
        const productos = await Productos.find({ category: req.params.category, state: '1' });
        res.status(200).json(productos);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener productos por categoría', error });
    }
};

// Obtener productos con bajo stock
export const getProductosByStock = async (req, res) => {
    try {
        const stockMinimo = parseInt(req.params.stock);
        const productos = await Productos.find({ stock: { $lt: stockMinimo }, state: '1' });
        res.status(200).json(productos);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener productos con bajo stock', error });
    }
};

export default {
    createProducto,
    getProductos,
    getProductoById,
    updateProducto,
    toggleProductoState,
    getProductosByCategory,
    getProductosByStock
};
