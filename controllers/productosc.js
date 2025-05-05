import axios from 'axios';
import cloudinary from '../utils/teximage.js';
import Productos from '../models/productos.js';
import Categoria from '../models/categorias.js';
import { Readable } from 'stream';

// Función para subir imagen a Cloudinary
const uploadImageFromUrl = async (url) => {
  const response = await axios({
    url,
    method: 'GET',
    responseType: 'arraybuffer',
  });

  const buffer = Buffer.from(response.data, 'binary');

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

// Crear un producto con validación de categoría
export const createProducto = async (req, res) => {
    try {
        const { name, price, stock, img, description, category, state , marca} = req.body;
        
        // Validar que la categoría exista
        const categoriaExistente = await Categoria.findById(category);
        if (!categoriaExistente) {
            return res.status(400).json({ message: 'La categoría no existe' });
        }

        // Validar precio y stock
        if (price <= 0 || stock < 0) {
            return res.status(400).json({ message: 'Precio o stock inválido' });
        }

        // Manejo de imágenes
        let cloudinaryImageUrl = img;
        if (img && img.startsWith('http')) {
            cloudinaryImageUrl = await uploadImageFromUrl(img);
        }

        // Crear el producto
        const producto = new Productos({
            name,
            price,
            stock,
            marca,
            description,
            img: cloudinaryImageUrl,
            category, // ObjectId de la categoría
            state: state || '1'
        });
        
        await producto.save();
        
        // Populate para devolver la categoría completa
        const productoConCategoria = await Productos.findById(producto._id)
            .populate('category', 'name description');
            
        res.status(201).json(productoConCategoria);
    } catch (error) {
        console.error("Error al crear el producto:", error);
        res.status(500).json({ 
            message: 'Error al crear el producto', 
            error: error.message 
        });
    }
};

// Obtener todos los productos activos con sus categorías
export const getProductos = async (req, res) => {
    try {
        const productos = await Productos.find({ state: '1' })
            .populate('category', 'name description');
            
        res.status(200).json(productos);
    } catch (error) {
        res.status(500).json({ 
            message: 'Error al obtener los productos', 
            error: error.message 
        });
    }
};

// Obtener un producto por ID con su categoría
export const getProductoById = async (req, res) => {
    try {
        const producto = await Productos.findById(req.params.id)
            .populate('category', 'name description');
            
        if (!producto) {
            return res.status(404).json({ message: 'Producto no encontrado' });
        }
        res.status(200).json(producto);
    } catch (error) {
        res.status(500).json({ 
            message: 'Error al obtener el producto', 
            error: error.message 
        });
    }
};

// Actualizar un producto
export const updateProducto = async (req, res) => {
    try {
        const { id } = req.params;
        const { category, img, ...updateData } = req.body;

        // Si se envía una categoría, validar que exista
        if (category) {
            const categoriaExistente = await Categoria.findById(category);
            if (!categoriaExistente) {
                return res.status(400).json({ message: 'La categoría no existe' });
            }
            updateData.category = category;
        }

        // Manejo de actualización de imagen
        if (img && img.startsWith('http')) {
            updateData.img = await uploadImageFromUrl(img);
        }

        const productoActualizado = await Productos.findByIdAndUpdate(
            id, 
            updateData, 
            { new: true }
        ).populate('category', 'name description');

        if (!productoActualizado) {
            return res.status(404).json({ message: 'Producto no encontrado' });
        }

        res.status(200).json(productoActualizado);
    } catch (error) {
        res.status(500).json({ 
            message: 'Error al actualizar el producto', 
            error: error.message 
        });
    }
};

// Cambiar estado de producto (activar/desactivar)
export const toggleProductoState = async (req, res) => {
    try {
        const producto = await Productos.findById(req.params.id);
        
        if (!producto) {
            return res.status(404).json({ message: 'Producto no encontrado' });
        }

        producto.state = producto.state === '1' ? '0' : '1';
        await producto.save();

        const productoActualizado = await Productos.findById(producto._id)
            .populate('category', 'name description');

        res.status(200).json({
            message: `Producto ${producto.state === '1' ? 'activado' : 'desactivado'}`,
            producto: productoActualizado
        });
    } catch (error) {
        res.status(500).json({ 
            message: 'Error al cambiar el estado del producto', 
            error: error.message 
        });
    }
};

// Obtener productos por categoría
export const getProductosByCategory = async (req, res) => {
    try {
        const { category } = req.params;
        
        // Validar que la categoría exista
        const categoriaExistente = await Categoria.findById(category);
        if (!categoriaExistente) {
            return res.status(404).json({ message: 'Categoría no encontrada' });
        }

        const productos = await Productos.find({ 
            category, 
            state: '1' 
        }).populate('category', 'name description');

        res.status(200).json(productos);
    } catch (error) {
        res.status(500).json({ 
            message: 'Error al obtener productos por categoría', 
            error: error.message 
        });
    }
};

// Obtener productos con bajo stock
export const getProductosByStock = async (req, res) => {
    try {
        const stockMinimo = parseInt(req.params.stock) || 5;
        
        const productos = await Productos.find({ 
            stock: { $lt: stockMinimo }, 
            state: '1' 
        }).populate('category', 'name description');

        res.status(200).json(productos);
    } catch (error) {
        res.status(500).json({ 
            message: 'Error al obtener productos con bajo stock', 
            error: error.message 
        });
    }
};

// Buscar productos por nombre o descripción
export const searchProductos = async (req, res) => {
    try {
        const { query } = req.query;
        
        if (!query || query.length < 3) {
            return res.status(400).json({ message: 'La búsqueda debe tener al menos 3 caracteres' });
        }

        const productos = await Productos.find({
            $and: [
                { state: '1' },
                {
                    $or: [
                        { name: { $regex: query, $options: 'i' } },
                        { description: { $regex: query, $options: 'i' } }
                    ]
                }
            ]
        }).populate('category', 'name description');

        res.status(200).json(productos);
    } catch (error) {
        res.status(500).json({ 
            message: 'Error al buscar productos', 
            error: error.message 
        });
    }
};

export default {
    createProducto,
    getProductos,
    getProductoById,
    updateProducto,
    toggleProductoState,
    getProductosByCategory,
    getProductosByStock,
    searchProductos
};