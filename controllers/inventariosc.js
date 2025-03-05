import Inventario from "../models/inventario.js";
import Productos from "../models/productos.js";
import Usuarios from "../models/usuarios.js";

// Registrar una nueva transacción en el inventario
export const createTransaccion = async (req, res) => {
    try {
        const { productoId, type, quantity, userId, reason } = req.body;

        // Verificar si el producto existe
        const producto = await Productos.findById(productoId);
        if (!producto) return res.status(404).json({ message: "Producto no encontrado" });

        // Verificar si el usuario existe
        const usuario = await Usuarios.findById(userId);
        if (!usuario) return res.status(404).json({ message: "Usuario no encontrado" });

        // Validar cantidad
        if (quantity <= 0) return res.status(400).json({ message: "La cantidad debe ser mayor a 0" });

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

        // Crear la transacción en el inventario
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
        res.status(500).json({ message: error.message });
    }
};

// Obtener todas las transacciones del inventario
export const getTransacciones = async (req, res) => {
    try {
        const transacciones = await Inventario.find()
            .populate('productoId', 'name price')
            .populate('userId', 'nombre email');

        res.status(200).json(transacciones);
    } catch (error) {
        res.status(500).json({ message: error.message });
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
        res.status(500).json({ message: error.message });
    }
};

// Actualizar una transacción (No recomendable modificar registros de inventario, pero si necesario)
export const toggleInventarioState = async (req, res) => {
    try {
        const { id } = req.params;
        const { type, quantity, reason } = req.body;

        const transaccion = await Inventario.findById(id);
        if (!transaccion) return res.status(404).json({ message: "Transacción no encontrada" });

        // Modificar el inventario en función de la actualización (cuidado con la lógica)
        if (type && type !== transaccion.type) {
            return res.status(400).json({ message: "No se permite cambiar el tipo de transacción" });
        }

        if (quantity && quantity !== transaccion.quantity) {
            return res.status(400).json({ message: "No se permite cambiar la cantidad de la transacción" });
        }

        // Actualizar solo el motivo si es necesario
        transaccion.reason = reason || transaccion.reason;
        await transaccion.save();

        res.status(200).json(transaccion);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};



export default{
    createTransaccion,
    getTransacciones,
    getTransaccionPorId,
    toggleInventarioState
}