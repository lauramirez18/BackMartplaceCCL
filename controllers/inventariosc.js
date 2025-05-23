import Inventario from "../models/inventario.js";
import Productos from "../models/productos.js";
import Usuarios from "../models/usuarios.js";

// Registrar una nueva transacción en el inventario
export const createTransaccion = async (req, res) => {
    try {
        const { productoId, type, quantity, userId, reason } = req.body;

        // Validaciones básicas
        if (!productoId || !type || !quantity || !userId) {
            return res.status(400).json({ message: "Todos los campos obligatorios deben estar completos" });
        }

        if (!['entrada', 'salida', 'devolucion'].includes(type)) {
            return res.status(400).json({ message: "Tipo de transacción no válido" });
        }

        if (quantity <= 0) {
            return res.status(400).json({ message: "La cantidad debe ser mayor a 0" });
        }

        // Verificar si el producto existe
        const producto = await Productos.findById(productoId);
        if (!producto) return res.status(404).json({ message: "Producto no encontrado" });

        // Verificar si el usuario existe
        const usuario = await Usuarios.findById(userId);
        if (!usuario) return res.status(404).json({ message: "Usuario no encontrado" });

        // Actualizar stock del producto
        if (type === 'entrada') {
            producto.stock += quantity;
        } else if (type === 'salida' || type === 'devolucion') {
            if (producto.stock < quantity) {
                return res.status(400).json({ message: "Stock insuficiente" });
            }
            producto.stock -= quantity;
        }
        await producto.save();

        // Crear la transacción
        const nuevaTransaccion = new Inventario({
            productoId,
            type,
            quantity,
            userId,
            reason
        });

        await nuevaTransaccion.save();
        res.status(201).json(nuevaTransaccion);

    } catch (error) {
        console.error("Error al registrar transacción:", error);
        res.status(500).json({ message: "Error al registrar transacción", error: error.message });
    }
};

// Obtener todas las transacciones
export const getTransacciones = async (req, res) => {
    try {
        const transacciones = await Inventario.find()
            .populate('productoId', 'name price')
            .populate('userId', 'nombre email');

        res.status(200).json(transacciones);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener transacciones", error: error.message });
    }
};

// Obtener una transacción específica por ID
export const getTransaccionPorId = async (req, res) => {
    try {
        const { id } = req.params;
        const transaccion = await Inventario.findById(id)
            .populate('productoId', 'name price')
            .populate('userId', 'nombre email');

        if (!transaccion) return res.status(404).json({ message: "Transacción no encontrada" });

        res.status(200).json(transaccion);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener la transacción", error: error.message });
    }
};

// Actualizar el motivo de una transacción (opcional)
export const toggleInventarioState = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        const transaccion = await Inventario.findById(id);
        if (!transaccion) return res.status(404).json({ message: "Transacción no encontrada" });

        // Solo se permite actualizar el motivo
        transaccion.reason = reason || transaccion.reason;
        await transaccion.save();

        res.status(200).json(transaccion);
    } catch (error) {
        res.status(500).json({ message: "Error al actualizar la transacción", error: error.message });
    }
};

export default {
    createTransaccion,
    getTransacciones,
    getTransaccionPorId,
    toggleInventarioState
};
