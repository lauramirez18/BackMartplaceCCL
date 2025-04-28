import { Router } from "express";
import { check } from "express-validator";
import {validarJWT} from "../middlewares/validar-jwt.js";
import { validarCampos } from "../middlewares/validar-campos.js";

import express from "express";
import {
    createTransaccion,
    getTransacciones,
    getTransaccionPorId,
    toggleInventarioState
} from "../controllers/inventario.js";

const router = express.Router();

// Ruta para crear una nueva transacción en el inventario
router.post("/", createTransaccion);

// Ruta para obtener todas las transacciones del inventario
router.get("/", getTransacciones);

// Ruta para obtener una transacción específica por ID
router.get("/:id", getTransaccionPorId);

// Ruta para actualizar una transacción (solo permite modificar el motivo)
router.put("/:id", toggleInventarioState);

export default router;
