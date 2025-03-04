import Productos from '../models/productos.js';

// Crear un producto
export const createProducto = async (req, res) => {
    try {
        const { nombre, precio, stock, img, categoria, estado } = req.body;
        const producto = new Productos({ nombre, precio, stock, img, categoria, estado });
        await producto.save();
        res.status(201).json(producto);
    } catch (error) {
        res.status(500).json({ message: 'Error al crear el producto', error });
    }
};

// Listar todos los productos
export const getProductos = async (req, res) => {
    try {
        const productos = await Productos.find();
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

// Cambiar estado de un producto (activar/inactivar)
export const toggleProductoState = async (req, res) => {
    try {
        const producto = await Productos.findById(req.params.id);
        if (!producto) {
            return res.status(404).json({ message: 'Producto no encontrado' });
        }
        
        producto.estado = producto.estado === '1' ? '0' : '1';
        await producto.save();
        
        res.status(200).json(producto);
    } catch (error) {
        res.status(500).json({ message: 'Error al cambiar el estado del producto', error });
    }
};

// Obtener productos por categoría
export const getProductosByCategory = async (req, res) => {
    try {
        const productos = await Productos.find({ categoria: req.params.categoria });
        res.status(200).json(productos);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener productos por categoría', error });
    }
};

// Obtener productos con stock bajo
export const getProductosByStock = async (req, res) => {
    try {
        const productos = await Productos.find({ stock: { $lt: req.params.stock } });
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
