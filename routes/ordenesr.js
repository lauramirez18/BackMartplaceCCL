import { Router } from "express";
import { check } from "express-validator";




import express from "express";
import {
    createOrden,
    getOrdenes,
    getOrdenById,
    updateOrden,
    getPayPalOrders,
    getPayPalOrderDetails,
    getOrdenesByUsuario,
    confirmarPagoPayPal
} from "../controllers/ordenesc.js";

const router = express.Router();

// Ruta para crear una nueva orden
router.post("/", createOrden);

// Ruta para obtener todas las órdenes
router.get("/", getOrdenes);

// Ruta para obtener una orden por ID
router.get("/:id", getOrdenById);

// Ruta para obtener órdenes por ID de usuario
router.get("/usuario/:usuarioId", getOrdenesByUsuario);

// Ruta para actualizar el estado de una orden
router.put("/:id", updateOrden);

// Ruta para confirmar pago de PayPal
router.post("/confirmar-pago", confirmarPagoPayPal);

// Nuevas rutas para PayPal
router.get("/paypal/orders", getPayPalOrders);
router.get("/paypal/orders/:id", getPayPalOrderDetails);

export default router;