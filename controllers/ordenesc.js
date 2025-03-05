import Ordenes from "../models/ordenes.js";
import Usuarios from "../models/usuarios.js";
import Productos from "../models/productos.js";

// Crear una nueva orden
export const createOrden = async (req, res) => {
    try {
        const { usuarioId, products } = req.body;

        // Verificar si el usuario existe
        const usuario = await Usuarios.findById(usuarioId);
        if (!usuario) return res.status(404).json({ message: "Usuario no encontrado" });

        let total = 0;

        // Verificar si los productos existen y calcular el total
        for (const item of products) {
            const producto = await Productos.findById(item.productId);
            if (!producto) return res.status(404).json({ message: `Producto ${item.productId} no encontrado` });

            total += item.quantity * producto.precio; // Suponiendo que en el modelo de productos el precio es "precio"
        }

        // Crear la orden
        const newOrden = new Ordenes({
            usuarioId,
            products,
            total,
            status: 'pendiente'
        });

        await newOrden.save();
        res.status(201).json(newOrden);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Obtener todas las órdenes
export const getOrdenes = async (req, res) => {
    try {
        const ordenes = await Ordenes.find().populate('usuarioId', 'nombre email').populate('products.productId', 'nombre precio');
        res.status(200).json(ordenes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Obtener una orden por ID
export const getOrdenById = async (req, res) => {
    try {
        const { id } = req.params;
        const orden = await Ordenes.findById(id).populate('usuarioId', 'nombre email').populate('products.productId', 'nombre precio');
        
        if (!orden) return res.status(404).json({ message: "Orden no encontrada" });

        res.status(200).json(orden);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Actualizar el estado de una orden
export const updateOrden = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        // Validar estado
        if (!['pendiente', 'pagado', 'cancelado'].includes(status)) {
            return res.status(400).json({ message: "Estado inválido" });
        }

        const ordenActualizada = await Ordenes.findByIdAndUpdate(id, { status }, { new: true });

        if (!ordenActualizada) return res.status(404).json({ message: "Orden no encontrada" });

        res.status(200).json(ordenActualizada);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};




// Cambiar el estado de una orden
export const cambiarEstadoOrden = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        // Validar que el estado sea uno de los permitidos
        const estadosPermitidos = ['pendiente', 'pagado', 'cancelado'];
        if (!estadosPermitidos.includes(status)) {
            return res.status(400).json({ message: "Estado no válido. Debe ser 'pendiente', 'pagado' o 'cancelado'." });
        }

        // Buscar y actualizar la orden
        const ordenActualizada = await Ordenes.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        );

        if (!ordenActualizada) {
            return res.status(404).json({ message: "Orden no encontrada" });
        }

        res.status(200).json({ message: "Estado de la orden actualizado", orden: ordenActualizada });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


